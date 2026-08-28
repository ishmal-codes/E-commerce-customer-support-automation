const { randomUUID: uuidv4 } = require('crypto');
const knowledgeBase = require('../services/knowledgeBase.service');
const shopify = require('../services/shopify.service');
const orderLookup = require('../services/orderLookup.service');
const sessionService = require('../services/session.service');
const escalationService = require('../services/escalation.service');
const llmService = require('../services/llm.service');
const { buildSystemPrompt } = require('../utils/promptBuilder');

/**
 * chat.controller.js
 * Orchestrates the full chat pipeline:
 *
 *  1. Validate & parse request
 *  2. Get/create session → load history
 *  3. Run escalation pre-check (keyword scan on user message)
 *  4. Detect intent → resolve order data (Shopify first, CSV fallback)
 *  5. Fetch relevant knowledge base context
 *  6. Assemble system prompt (policy + order + product context)
 *  7. Call LLM (Gemini primary → Groq fallback)
 *  8. Run escalation post-check (LLM confidence markers)
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

    // ── 4. Intent detection & order lookup ────────────────────────────────
    let orderContext = null;
    const sourcesUsed = [];

    // Extract any order IDs from the message
    const mentionedOrderIds = orderLookup.extractOrderIdsFromMessage(userMessage);

    if (mentionedOrderIds.length > 0) {
      const orderId = mentionedOrderIds[0];

      // Try Shopify first (live data)
      const shopifyOrder = await shopify.getOrderById(orderId);
      if (shopifyOrder) {
        orderContext = shopifyOrder;
        sourcesUsed.push('shopify_orders');
      } else {
        // Fallback to CSV data
        const csvOrder = orderLookup.getCsvOrder(orderId);
        if (csvOrder) {
          orderContext = csvOrder;
          sourcesUsed.push('csv_orders');
        }
      }
    } else if (customerEmail) {
      // Try to look up orders by email if no order ID in message
      const emailOrders = await shopify.getOrdersByEmail(customerEmail);
      if (emailOrders.length > 0) {
        // Surface the most recent order as context
        orderContext = emailOrders[0];
        sourcesUsed.push('shopify_orders');
      }
    }

    // ── 5. Knowledge base context ──────────────────────────────────────────
    const kbContext = knowledgeBase.getRelevantContext(userMessage);

    if (kbContext.shipping) sourcesUsed.push('shipping_policy');
    if (kbContext.returns) sourcesUsed.push('returns_policy');
    if (kbContext.faq.length > 0) sourcesUsed.push('faq');
    if (kbContext.products.length > 0) sourcesUsed.push('product_catalog');

    // ── 6. Build system prompt ─────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(
      {
        shipping: kbContext.shipping,
        returns: kbContext.returns,
        faq: kbContext.faq,
      },
      orderContext,
      kbContext.products.length > 0 ? kbContext.products : null
    );

    // ── 7. Call LLM ────────────────────────────────────────────────────────
    const llmResult = await llmService.generateResponse({
      sessionId,
      systemPrompt,
      history,
      userMessage,
    });

    sourcesUsed.push(llmResult.providerUsed);

    // ── 8. Post-LLM escalation check (confidence markers) ─────────────────
    const postCheck = escalationService.detectEscalation(
      userMessage,
      llmResult.text,
      preCheck.shouldEscalate // Carry forward pre-check result
    );

    const isEscalated = postCheck.shouldEscalate;
    const escalationReason = postCheck.reason;

    // Remember the handoff so subsequent messages skip the LLM (bot stays aside)
    if (isEscalated && meta) {
      meta.escalated = true;
      meta.escalationReason = escalationReason;
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
