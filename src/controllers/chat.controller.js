const { randomUUID: uuidv4 } = require('crypto');
const knowledgeBase = require('../services/knowledgeBase.service');
const shopify = require('../services/shopify.service');
const sessionService = require('../services/session.service');
const escalationService = require('../services/escalation.service');
const llmService = require('../services/llm.service');
const { validateGrounding } = require('../utils/groundingValidator');
const { buildSystemPrompt, REFUSAL_PHRASE } = require('../utils/promptBuilder');
const { stripMarkdown } = require('../utils/plainText');

// ── Two-strike refusal flow ────────────────────────────────────────────────
// The bot never auto-escalates on a single miss. Strike 1 asks the customer
// to rephrase (offering a human). Strike 2 asks whether they WANT a human;
// handoff starts only when they confirm.
const FIRST_REFUSAL_TEXT =
  "I couldn't find an answer to that in our store data. Could you rephrase your question? " +
  'If you\'d rather speak with a person, just say "talk to a human".';
const HANDOFF_CONFIRM_TEXT =
  "I still can't answer that confidently from our store data. " +
  'Would you like me to connect you with a human specialist? (yes / no)';
/** Affirmative replies to the "connect you with a human?" question. */
const YES_RE = /^(yes|yeah|yep|yup|sure|ok(ay)?|please|go ahead|do it|handoff|hand off|connect|human|agent)\b/i;

/**
 * chat.controller.js
 * Orchestrates the full chat pipeline:
 *
 *  1. Validate & parse request
 *  2. Get/create session → load history
 *  3. Run escalation pre-check (keyword scan on user message)
 *  4. Function-calling agent turn: LLM decides which tools to call
 *     (search_products, get_order_status, get_policy, …), tools execute
 *     against real data, LLM composes its answer from tool results only
 *  7b. Post-LLM grounding check: every claim must exist in THIS turn's
 *      tool results (zero tool calls → any factual claim auto-fails)
 *  7c. Two-strike refusal flow: first miss → ask to rephrase (offer human);
 *      second miss → ask if they WANT a human; handoff only on confirmation
 *  8. Run escalation post-check — confirmed refusals escalate via a
 *     structured signal (not via wording detection)
 *  9. Persist user + assistant turns to session
 * 10. Fire escalation notifications (non-blocking)
 * 11. Return clean response
 */

/**
 * POST /api/chat
 * Body: { sessionId?: string, message: string, customerEmail?: string }
 */
async function handleChat(req, res, next) {
  try {
    // ── 1. Parse & validate ────────────────────────────────────────────────
    const { message, customerEmail } = req.body;
    let { sessionId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'message is required and must be a non-empty string.' });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({ error: 'message exceeds the 2000 character limit.' });
    }

    // Generate a new session ID if none provided
    if (!sessionId || typeof sessionId !== 'string') {
      sessionId = uuidv4();
    }

    const userMessage = message.trim();

    // ── 2. Session ─────────────────────────────────────────────────────────
    sessionService.getOrCreateSession(sessionId, { customerEmail });
    const history = sessionService.getHistory(sessionId);

    // ── 2b. Already handed off? Bot steps aside; message goes to the care team ──
    // `req.body.escalated` is the frontend's DB-backed handoff state (source of
    // truth); the session metadata covers backend-only/standalone usage.
    const meta = sessionService.getMetadata(sessionId);
    const alreadyEscalated = req.body.escalated === true || Boolean(meta?.escalated);
    if (alreadyEscalated) {
      sessionService.addTurn(sessionId, 'user', userMessage);
      return res.status(200).json({
        sessionId,
        response:
          "Thanks — that's gone straight to the care team and they'll reply right here in the chat.",
        escalated: true,
        sourcesUsed: ['human_handoff'],
        costMetrics: null,
      });
    }

    // ── 3. Pre-LLM escalation check (keyword scan) ─────────────────────────
    const preCheck = escalationService.detectEscalation(userMessage);
    if (preCheck.shouldEscalate) {
      // We still generate an LLM response, but we flag it and notify founders.
      // The LLM is given escalation guidance in the system prompt below.
    }

    // ── 3b. Handoff confirmation pending? ─────────────────────────────
    // After the second miss the bot asked "connect you with a human?" — the
    // customer's next word decides. Handoff starts ONLY on confirmation.
    if (meta?.awaitingHandoffConfirm) {
      meta.awaitingHandoffConfirm = false;
      if (YES_RE.test(userMessage)) {
        meta.escalated = true;
        meta.escalationReason = 'Customer confirmed they want a human specialist';
        meta.refusalCount = 0;
        sessionService.addTurn(sessionId, 'user', userMessage);
        const confirmText =
          "Of course — I've connected you with a human specialist. " +
          "They can see this whole conversation and will reply right here.";
        sessionService.addTurn(sessionId, 'model', confirmText);
        escalationService.sendEscalationNotification({
          sessionId,
          userMessage,
          reason: meta.escalationReason,
          customerEmail: customerEmail || meta.customerEmail,
          llmResponse: confirmText,
        });
        return res.status(200).json({
          sessionId,
          response: confirmText,
          escalated: true,
          sourcesUsed: ['human_handoff'],
          costMetrics: null,
        });
      }
      // Declined or moved on — clear the strikes and process normally below.
      meta.refusalCount = 0;
    }

    // ── 4. Function-calling agent turn ────────────────────────────────────
    // The LLM decides WHICH tools to call (search_products, get_order_status,
    // get_policy, …); tools run against the real data sources and the LLM
    // composes its reply ONLY from those results. No keyword pre-retrieval.
    const sourcesUsed = [];

    // `refusalReason` is the STRUCTURED refusal signal: escalation (step 8)
    // is triggered by this flag, never by wording in the reply text.
    let llmResult;
    let refusalReason = null;
    let refusalHandled = false; // set when a refusal was consumed by the two-strike flow
    let quickReplies = null; // optional chips the frontend should show for this turn

    const systemPrompt = buildSystemPrompt();
    try {
      llmResult = await llmService.generateAgentResponse({
        sessionId,
        systemPrompt,
        history,
        userMessage,
      });
    } catch (llmErr) {
      // Both providers failed, or Gemini failed mid-loop after tools had
      // already run. Never guess — emit the safe refusal and let the
      // two-strike flow (7c) handle it.
      console.error(`[Chat] Agent turn failed (session: ${sessionId}): ${llmErr.message}`);
      refusalReason = 'refused: LLM agent unavailable';
      llmResult = {
        text: REFUSAL_PHRASE, // replaced by the two-strike flow below (7c)
        providerUsed: 'none',
        costMetrics: null,
        toolsCalled: [],
        toolContextText: '',
        toolProducts: [],
      };
    }

    // ── 7b. Grounding check — every claim must exist in this turn's tool results ──
    // The grounding corpus is ONLY the JSON of the tool results returned this
    // turn. Zero tool calls → empty corpus → any numeric/product claim
    // auto-fails, mechanically enforcing "no facts without a tool call".
    if (llmResult.providerUsed !== 'none') {
      const groundingCheck = validateGrounding(llmResult.text, {
        contextText: llmResult.toolContextText || '',
        products: llmResult.toolProducts || [],
      });
      if (!groundingCheck.ok) {
        console.warn(
          `[Chat] Grounding violation blocked (session: ${sessionId}): ${groundingCheck.violations.join('; ')}`
        );
        refusalReason = 'refused: grounding violation — LLM response contained unsupported facts';
        llmResult = { ...llmResult, text: REFUSAL_PHRASE };
      }
    }

    sourcesUsed.push(...(llmResult.toolsCalled || []).map((t) => `tool:${t.tool}`));
    if (llmResult.providerUsed && llmResult.providerUsed !== 'none') {
      sourcesUsed.push(llmResult.providerUsed);
    }

    // ── 7c. Two-strike refusal flow ───────────────────────────────────────
    // Refusals never escalate on the first miss. Strike 1 → rephrase prompt
    // with a human option; strike 2 → confirm-before-handoff. Explicit human
    // requests still escalate immediately via the keyword pre-check.
    if (refusalReason && !preCheck.shouldEscalate) {
      if (meta) {
        refusalHandled = true;
        meta.refusalCount = (meta.refusalCount || 0) + 1;
        if (meta.refusalCount === 1) {
          llmResult = { ...llmResult, text: FIRST_REFUSAL_TEXT };
          quickReplies = ['Talk to a human', 'Track my order', 'Shipping times'];
          refusalReason = null; // informational only — no handoff yet
        } else {
          meta.awaitingHandoffConfirm = true;
          meta.refusalCount = 0;
          llmResult = { ...llmResult, text: HANDOFF_CONFIRM_TEXT };
          quickReplies = ['Yes, talk to a human', "No, I'll rephrase"];
          refusalReason = null; // awaiting the customer's choice
        }
      }
    }

    // ── 8. Post-LLM escalation check ───────────────────────────────────────
    // Pass A: detect what the check sees. LLM-authored low-confidence
    // refusals are treated as a refusal STRIKE (two-strike flow), not as an
    // immediate handoff. Keyword hits and structured refusals escalate now.
    const passA = escalationService.detectEscalation(
      userMessage,
      llmResult.text,
      preCheck.shouldEscalate || refusalReason !== null,
      refusalReason || preCheck.reason
    );

    let postCheck = passA;
    if (passA.shouldEscalate
      && passA.reason.startsWith('low_confidence:')
      && !preCheck.shouldEscalate
      && !refusalReason) {
      // The LLM itself answered with a refusal. Route it through the same
      // two-strike flow instead of handing off immediately.
      if (meta) {
        refusalHandled = true;
        meta.refusalCount = (meta.refusalCount || 0) + 1;
        if (meta.refusalCount === 1) {
          llmResult = { ...llmResult, text: FIRST_REFUSAL_TEXT };
          quickReplies = ['Talk to a human', 'Track my order', 'Shipping times'];
        } else {
          meta.awaitingHandoffConfirm = true;
          meta.refusalCount = 0;
          llmResult = { ...llmResult, text: HANDOFF_CONFIRM_TEXT };
          quickReplies = ['Yes, talk to a human', "No, I'll rephrase"];
        }
      }
      postCheck = { shouldEscalate: false, reason: 'none' };
    }

    const isEscalated = postCheck.shouldEscalate;
    const escalationReason = postCheck.reason;

    // ── 8b. Plain-text sanitization ─────────────────────────────────────────
    // The chat widget renders plain text only. Even with the formatting rules
    // in the system prompt, some models still emit markdown emphasis (e.g.
    // "**Processing**"). Strip any leftover syntax so symbols never reach the
    // customer as literal characters. Facts are untouched — only the markup.
    llmResult = { ...llmResult, text: stripMarkdown(llmResult.text) };

    // Remember the handoff so subsequent messages skip the LLM (bot stays aside)
    if (isEscalated && meta) {
      meta.escalated = true;
      meta.escalationReason = escalationReason;
      meta.refusalCount = 0;
    } else if (!refusalReason && !refusalHandled && meta) {
      // A successful answer resets the refusal streak.
      meta.refusalCount = 0;
    }

    // ── 9. Persist turns to session ────────────────────────────────────────
    sessionService.addTurn(sessionId, 'user', userMessage);
    sessionService.addTurn(sessionId, 'model', llmResult.text);

    // ── 10. Fire escalation notifications (non-blocking) ──────────────────
    if (isEscalated) {
      escalationService.sendEscalationNotification({
        sessionId,
        userMessage,
        reason: escalationReason,
        customerEmail: customerEmail || sessionService.getMetadata(sessionId)?.customerEmail,
        llmResponse: llmResult.text,
      });
    }

    // ── 11. Respond ────────────────────────────────────────────────────────
    return res.status(200).json({
      sessionId,
      response: llmResult.text,
      escalated: isEscalated,
      sourcesUsed: [...new Set(sourcesUsed)], // Deduplicate
      costMetrics: llmResult.costMetrics,
      toolsCalled: llmResult.toolsCalled || [], // tool-call trace for transparency
      ...(quickReplies ? { quickReplies } : {}),
    });

  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/health
 * Returns server status, Shopify connectivity, session count.
 */
async function handleHealth(req, res, next) {
  try {
    const shopifyStatus = await shopify.checkShopifyConnection();
    const kb = knowledgeBase.getFullKnowledgeBase();

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: require('../../package.json').version,
      environment: process.env.NODE_ENV || 'development',
      services: {
        shopify: shopifyStatus,
        knowledgeBase: {
          loaded: Boolean(kb),
          faqEntries: kb?.faqEntries?.length || 0,
          products: kb?.products?.length || 0,
          shippingPolicy: Boolean(kb?.shippingPolicy),
          returnsPolicy: Boolean(kb?.returnsPolicy),
        },
        sessions: {
          active: sessionService.getActiveSessionCount(),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleChat, handleHealth };
