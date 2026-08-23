'use strict';

/**
 * tokenTracker.js
 * Tracks LLM token usage and estimates cost per call and per session.
 *
 * Pricing reference (USD per 1M tokens, as of mid-2024):
 *   Gemini 1.5 Flash: input $0.075 / output $0.30
 *   Groq llama3-8b:   input $0.05  / output $0.08
 *   Groq mixtral-8x7b:input $0.27  / output $0.27
 *
 * These are estimates — update MODEL_PRICING if rates change.
 */

/** @type {Record<string, { inputPerMToken: number, outputPerMToken: number }>} */
const MODEL_PRICING = {
  'gemini-1.5-flash': { inputPerMToken: 0.075, outputPerMToken: 0.30 },
  'gemini-1.5-pro': { inputPerMToken: 3.50, outputPerMToken: 10.50 },
  'llama-3.1-8b-instant': { inputPerMToken: 0.05, outputPerMToken: 0.08 },
  'llama-3.3-70b-versatile': { inputPerMToken: 0.59, outputPerMToken: 0.79 },
  'llama3-8b-8192': { inputPerMToken: 0.05, outputPerMToken: 0.08 },
  'llama3-70b-8192': { inputPerMToken: 0.59, outputPerMToken: 0.79 },
  'mixtral-8x7b-32768': { inputPerMToken: 0.27, outputPerMToken: 0.27 },
};

/** In-memory store: sessionId → cumulative stats */
const sessionStore = new Map();

/**
 * Calculate USD cost for a single LLM call.
 * @param {string} model
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {number} cost in USD
 */
function calculateCost(model, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMToken;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMToken;
  return parseFloat((inputCost + outputCost).toFixed(8));
}

/**
 * Record a completed LLM call against a session.
 * @param {string} sessionId
 * @param {string} model
 * @param {number} inputTokens
 * @param {number} outputTokens
 * @returns {{ inputTokens, outputTokens, estimatedCostUSD, model }} — metrics for this call
 */
function recordUsage(sessionId, model, inputTokens, outputTokens) {
  const cost = calculateCost(model, inputTokens, outputTokens);

  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUSD: 0,
      callCount: 0,
      models: [],
      createdAt: new Date().toISOString(),
      lastUpdatedAt: null,
    });
  }

  const session = sessionStore.get(sessionId);
  session.totalInputTokens += inputTokens;
  session.totalOutputTokens += outputTokens;
  session.totalCostUSD = parseFloat((session.totalCostUSD + cost).toFixed(8));
  session.callCount += 1;
  if (!session.models.includes(model)) session.models.push(model);
  session.lastUpdatedAt = new Date().toISOString();

  return {
    inputTokens,
    outputTokens,
    estimatedCostUSD: cost,
    model,
  };
}

/**
 * Get cumulative usage stats for a session.
 * @param {string} sessionId
 * @returns {object|null}
 */
function getSessionStats(sessionId) {
  return sessionStore.get(sessionId) || null;
}

/**
 * Remove a session's tracking record (call on session eviction).
 * @param {string} sessionId
 */
function clearSession(sessionId) {
  sessionStore.delete(sessionId);
}

/**
 * Returns a snapshot of all active sessions (for admin/debugging).
 * @returns {object[]}
 */
function getAllSessionStats() {
  const result = [];
  for (const [id, stats] of sessionStore.entries()) {
    result.push({ sessionId: id, ...stats });
  }
  return result;
}

module.exports = { recordUsage, getSessionStats, clearSession, getAllSessionStats, calculateCost };
