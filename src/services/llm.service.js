'use strict';

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const config = require('../config');
const { recordUsage } = require('../utils/tokenTracker');

/**
 * llm.service.js
 * Dual-LLM pipeline: Gemini (primary) → Groq (automatic fallback).
 *
 * Fallback triggers:
 *   - Gemini API error (any status code)
 *   - Gemini rate-limit (429)
 *   - Gemini call exceeds LLM_TIMEOUT_MS
 *   - Gemini API key not configured
 *
 * Returns a standardised response object regardless of which LLM was used.
 */

// ── Gemini setup ─────────────────────────────────────────────────────────────
let _geminiClient = null;
let _geminiModel = null;

function _getGeminiModel() {
  if (_geminiModel) return _geminiModel;
  if (!config.gemini.apiKey) throw new Error('Gemini API key not configured');
  _geminiClient = new GoogleGenerativeAI(config.gemini.apiKey);
  _geminiModel = _geminiClient.getGenerativeModel({
    model: config.gemini.model,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });
  return _geminiModel;
}

// ── Groq setup ───────────────────────────────────────────────────────────────
let _groqClient = null;

function _getGroqClient() {
  if (_groqClient) return _groqClient;
  if (!config.groq.apiKey) throw new Error('Groq API key not configured');
  _groqClient = new Groq({ apiKey: config.groq.apiKey });
  return _groqClient;
}

// ── Timeout wrapper ───────────────────────────────────────────────────────────
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`LLM call timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

/**
 * Call Gemini with the given system prompt, history, and user message.
 *
 * @param {string} systemPrompt
 * @param {Array<{role:string,content:string}>} history - Previous conversation turns
 * @param {string} userMessage
 * @returns {Promise<{ text: string, inputTokens: number, outputTokens: number }>}
 */
async function _callGemini(systemPrompt, history, userMessage) {
  const model = _getGeminiModel();

  // Gemini uses { role: 'user' | 'model', parts: [{ text }] }
  const geminiHistory = history.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : turn.role,
    parts: [{ text: turn.content }],
  }));

  const chat = model.startChat({
    history: geminiHistory,
    // Gemini requires systemInstruction as a Content object, not a plain string
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.3,    // Low temp for factual support responses
      topP: 0.8,
    },
  });

  const result = await chat.sendMessage(userMessage);
  const response = result.response;
  const text = response.text();

  // Extract token usage from Gemini response metadata
  const usageMetadata = response.usageMetadata || {};
  const inputTokens = usageMetadata.promptTokenCount || Math.ceil((systemPrompt.length + userMessage.length) / 4);
  const outputTokens = usageMetadata.candidatesTokenCount || Math.ceil(text.length / 4);

  return { text, inputTokens, outputTokens };
}

/**
 * Call Groq with the given system prompt, history, and user message.
 *
 * @param {string} systemPrompt
 * @param {Array<{role:string,content:string}>} history
 * @param {string} userMessage
 * @returns {Promise<{ text: string, inputTokens: number, outputTokens: number }>}
 */
async function _callGroq(systemPrompt, history, userMessage) {
  const groq = _getGroqClient();

  // Groq uses OpenAI-compatible message format: user / assistant / system
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((turn) => ({
      role: turn.role === 'model' ? 'assistant' : turn.role,
      content: turn.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: config.groq.model,
    messages,
    max_tokens: 512,
    temperature: 0.3,
    top_p: 0.8,
  });

  const choice = completion.choices[0];
  const text = choice.message.content || '';
  const inputTokens = completion.usage?.prompt_tokens || Math.ceil((systemPrompt.length + userMessage.length) / 4);
  const outputTokens = completion.usage?.completion_tokens || Math.ceil(text.length / 4);

  return { text, inputTokens, outputTokens };
}

/**
 * Generate a chat response using the dual-LLM pipeline.
 * Gemini is tried first; Groq is used automatically on any failure.
 *
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string} params.systemPrompt - Assembled by promptBuilder
 * @param {Array} params.history - Conversation history (trimmed)
 * @param {string} params.userMessage - Current user turn
 * @returns {Promise<{
 *   text: string,
 *   sourcesUsed: string[],
 *   costMetrics: object,
 *   providerUsed: string
 * }>}
 */
async function generateResponse({ sessionId, systemPrompt, history, userMessage }) {
  let providerUsed = null;
  let llmResult = null;

  // ── Attempt Gemini ───────────────────────────────────────────────────────
  if (config.gemini.apiKey) {
    try {
      llmResult = await withTimeout(
        _callGemini(systemPrompt, history, userMessage),
        config.llm.timeoutMs
      );
      providerUsed = 'gemini';
      console.log(`[LLM] Gemini responded (session: ${sessionId})`);
    } catch (geminiErr) {
      console.warn(`[LLM] Gemini failed, falling back to Groq. Reason: ${geminiErr.message}`);
    }
  } else {
    console.warn('[LLM] Gemini API key not set — skipping to Groq fallback.');
  }

  // ── Fallback to Groq ─────────────────────────────────────────────────────
  if (!llmResult) {
    if (!config.groq.apiKey) {
      throw new Error('Both Gemini and Groq failed or are unconfigured. Cannot generate response.');
    }
    try {
      llmResult = await withTimeout(
        _callGroq(systemPrompt, history, userMessage),
        config.llm.timeoutMs
      );
      providerUsed = 'groq';
      console.log(`[LLM] Groq fallback responded (session: ${sessionId})`);
    } catch (groqErr) {
      throw new Error(`All LLM providers failed. Groq error: ${groqErr.message}`);
    }
  }

  // ── Record token usage ───────────────────────────────────────────────────
  const modelName = providerUsed === 'gemini' ? config.gemini.model : config.groq.model;
  const costMetrics = recordUsage(sessionId, modelName, llmResult.inputTokens, llmResult.outputTokens);

  return {
    text: llmResult.text,
    sourcesUsed: [providerUsed],
    costMetrics,
    providerUsed,
  };
}

module.exports = { generateResponse };
