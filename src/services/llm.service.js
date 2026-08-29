/**
 * Trevolk Support Bot — LLM service (function-calling agent loop)
 *
 * Provider strategy: Gemini-primary, Groq-fallback (unchanged policy).
 *   - If Gemini fails BEFORE any tool has been executed, the whole turn is
 *     retried on Groq from scratch (both loops are stateless, so this is safe).
 *   - If Gemini fails MID-LOOP (after tool results exist), we do NOT replay
 *     the half-conversation into Groq (different function-calling formats).
 *     Instead we surface the error and the controller emits the safe refusal.
 *
 * The loop: user message → LLM (with tool definitions) → LLM calls tools →
 * backend executes tools against real data → results fed back → repeat up to
 * MAX_TOOL_ROUNDS → LLM composes a FINAL text answer using ONLY tool results.
 *
 * Returns everything the controller needs: final text, provider used,
 * accumulated token/cost metrics, the tool-call trace (for transparency and
 * logs), and the raw tool-result JSON corpus (grounding context).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const config = require('../config/index');
const toolsService = require('./tools.service');

const MAX_TOOL_ROUNDS = 4;

let geminiModel = null;
let groqClient = null;

/**
 * Lazily create the Gemini model only when the API key is configured.
 * @returns {object|null}
 */
function getGeminiModel() {
  if (!config.gemini.apiKey) return null;
  if (!geminiModel) {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    geminiModel = genAI.getGenerativeModel({ model: config.gemini.model });
  }
  return geminiModel;
}

/**
 * Lazily create the Groq client only when the API key is configured.
 * @returns {object|null}
 */
function getGroqClient() {
  if (!config.groq.apiKey) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: config.groq.apiKey });
  }
  return groqClient;
}

/** Wrap a promise with the configured LLM timeout. */
function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${config.llm.timeoutMs}ms`)), config.llm.timeoutMs),
    ),
  ]);
}

/* --------------------------------------------------------------------- */
/* Shared collector: accumulates tokens, costs and the tool trace         */
/* --------------------------------------------------------------------- */

function newCollector() {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    cost: 0,
    durationMs: 0,
    toolsCalled: [], // [{ tool, args, summary }]
    toolResults: [], // [{ tool, result }] — the grounding corpus
  };
}

function recordToolExecution(collector, name, args, result) {
  collector.toolsCalled.push({ tool: name, args, summary: toolsService.summarizeToolResult(name, result) });
  collector.toolResults.push({ tool: name, result });
}

function buildOutcome(collector, text, providerUsed, startTime) {
  return {
    text,
    providerUsed,
    costMetrics: {
      provider: providerUsed,
      model: providerUsed === 'gemini' ? config.gemini.model : config.groq.model,
      inputTokens: collector.inputTokens,
      outputTokens: collector.outputTokens,
      totalTokens: collector.totalTokens,
      estimatedCostUSD: collector.cost,
      latencyMs: Date.now() - startTime,
    },
    toolsCalled: collector.toolsCalled,
    toolContextText: collector.toolResults
      .map((t) => `${t.tool}: ${JSON.stringify(t.result)}`)
      .join('\n'),
    toolProducts: collector.toolResults.flatMap((t) => toolsService.extractProductsFromResult(t.result)),
  };
}

/* --------------------------------------------------------------------- */
/* Gemini agent loop (native function calling)                            */
/* --------------------------------------------------------------------- */

async function runGeminiAgent({ model, systemPrompt, history, userMessage, collector }) {
  // Convert session history to Gemini content format.
  const geminiHistory = history
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

  const chat = model.startChat({
    history: geminiHistory,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    tools: [{ functionDeclarations: toolsService.TOOL_DEFINITIONS }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
  });

  let pending = userMessage;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const result = await withTimeout(chat.sendMessage(pending), `Gemini round ${round}`);
    const response = result.response;

    const usage = response.usageMetadata || {};
    collector.inputTokens += usage.promptTokenCount || 0;
    collector.outputTokens += usage.candidatesTokenCount || 0;
    collector.totalTokens += usage.totalTokenCount || 0;

    const functionCalls = response.functionCalls ? response.functionCalls() : [];

    if (!functionCalls || functionCalls.length === 0) {
      // No tool calls → final text answer.
      return response.text() || '';
    }

    // Execute every requested tool call against the real data sources and
    // feed the results back as functionResponse parts.
    const responseParts = [];
    for (const fc of functionCalls) {
      const args = fc.args || {};
      const toolResult = await toolsService.executeTool(fc.name, args);
      recordToolExecution(collector, fc.name, args, toolResult);
      responseParts.push({ functionResponse: { name: fc.name, response: { result: toolResult } } });
    }
    pending = { role: 'user', parts: responseParts };
  }

  // Round cap exhausted without a final answer.
  return '';
}

/* --------------------------------------------------------------------- */
/* Groq agent loop (OpenAI-compatible tool_calls)                         */
/* --------------------------------------------------------------------- */

async function runGroqAgent({ client, systemPrompt, history, userMessage, collector }) {
  const groqHistory = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...groqHistory,
    { role: 'user', content: userMessage },
  ];

  // gpt-oss models on Groq REQUIRE temperature=1.0; other models use 0.3.
  const isGptOss = config.groq.model.includes('gpt-oss');

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const completion = await withTimeout(
      client.chat.completions.create({
        model: config.groq.model,
        messages,
        tools: toolsService.toGroqTools(),
        tool_choice: 'auto', // Groq does not support 'required'/'none'
        temperature: isGptOss ? 1 : 0.3,
        max_tokens: 1024,
      }),
      `Groq round ${round}`,
    );

    collector.inputTokens += completion.usage?.prompt_tokens || 0;
    collector.outputTokens += completion.usage?.completion_tokens || 0;
    collector.totalTokens += completion.usage?.total_tokens || 0;

    const msg = completion.choices?.[0]?.message;
    if (!msg) return '';

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content || '';
    }

    // Persist the assistant's tool-call message, then append tool results.
    messages.push({ role: 'assistant', content: msg.content || null, tool_calls: msg.tool_calls });
    for (const tc of msg.tool_calls) {
      let args = {};
      try {
        args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
      } catch {
        args = {};
      }
      const toolResult = await toolsService.executeTool(tc.function.name, args);
      recordToolExecution(collector, tc.function.name, args, toolResult);
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  return '';
}

/* --------------------------------------------------------------------- */
/* Public API                                                             */
/* --------------------------------------------------------------------- */

/**
 * Run the full tool-calling agent turn with Gemini-primary / Groq-fallback.
 *
 * @param {object} opts
 * @param {string} opts.sessionId - Session ID for logging.
 * @param {string} opts.systemPrompt - Tool-use system prompt.
 * @param {Array} opts.history - [{role:'user'|'assistant', content}]
 * @param {string} opts.userMessage - The new user message.
 * @returns {Promise<{text: string, providerUsed: string, costMetrics: object,
 *   toolsCalled: Array, toolContextText: string, toolProducts: Array}>}
 */
async function generateAgentResponse({ sessionId, systemPrompt, history, userMessage }) {
  const startTime = Date.now();
  const model = getGeminiModel();

  // 1. Gemini primary
  if (model) {
    const collector = newCollector();
    try {
      const text = await runGeminiAgent({ model, systemPrompt, history, userMessage, collector });
      collector.durationMs = Date.now() - startTime;
      console.log(`[LLM] Gemini agent (${sessionId}): ${collector.toolsCalled.length} tool call(s), ${collector.totalTokens} tokens`);
      return buildOutcome(collector, text, 'gemini', startTime);
    } catch (err) {
      console.error(`[LLM] Gemini agent failed (${sessionId}): ${err.message}`);
      // Mid-loop failure with executed tools: replaying into Groq would mix
      // incompatible function-calling formats. Let the controller refuse safely.
      if (collector.toolsCalled.length > 0) {
        throw err;
      }
    }
  } else {
    console.warn('[LLM] Gemini API key not configured.');
  }

  // 2. Groq fallback (fresh turn — safe because no tool state exists yet)
  const client = getGroqClient();
  if (!client) {
    throw new Error('No LLM provider configured. Set GEMINI_API_KEY or GROQ_API_KEY.');
  }

  const collector = newCollector();
  const text = await runGroqAgent({ client, systemPrompt, history, userMessage, collector });
  collector.durationMs = Date.now() - startTime;
  console.log(`[LLM] Groq agent (${sessionId}): ${collector.toolsCalled.length} tool call(s), ${collector.totalTokens} tokens`);
  return buildOutcome(collector, text, 'groq', startTime);
}

module.exports = {
  generateAgentResponse,
};
