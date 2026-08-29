'use strict';

const { getFullKnowledgeBase } = require('../services/knowledgeBase.service');

/**
 * groundingValidator.js
 * Post-LLM fact check. Every factual claim in the assistant's reply must be
 * traceable to the retrieved context that was actually passed to the LLM.
 *
 * Checks performed:
 *   1. Every number in the response (prices, durations, counts) must appear
 *      in the retrieved context. A fabricated "$799" or "21 days" fails.
 *   2. Every catalog product referenced in the response must be one of the
 *      products that were retrieved for this question — the LLM cannot sneak
 *      in a product that was never in its context.
 *
 * On any violation the caller must replace the response with the safe
 * refusal message instead of risking an unsupported claim.
 */

/** Extract the numeric claims from a text (handles $1,149 / 5–7 / 6.7-inch). */
function extractNumbers(text) {
  const matches = text.match(/\$?\d[\d,]*(?:\.\d+)?/g) || [];
  return matches.map((m) => ({
    raw: m,
    // Numeric value with separators stripped; decimals rounded to 2 places so
    // "$699" and "699.00" compare equal.
    value: Math.round(parseFloat(m.replace(/[$,]/g, '')) * 100) / 100,
  }));
}

/** Numbers we never treat as factual claims (calendar years, list markers). */
function isBenignNumber(num, raw, responseText) {
  const year = new Date().getFullYear();
  if (Number.isInteger(num.value) && num.value >= year - 2 && num.value <= year + 2) {
    return true; // a year reference, not a data claim
  }
  // Numbering like "1." / "2)" at the start of a list item
  return new RegExp(`(^|\\n)\\s*${raw.replace(/\$/g, '\\$')}[.).:]`).test(responseText);
}

/**
 * Validate that a response is fully grounded in the context it was built from.
 *
 * @param {string} responseText - The LLM's draft reply
 * @param {object} grounding - { contextText, products }
 *   contextText: the exact factual text that was injected into the prompt
 *   products:    the product objects that were retrieved for this question
 * @returns {{ ok: boolean, violations: string[] }}
 */
function validateGrounding(responseText, { contextText, products }) {
  const violations = [];
  if (!responseText || !responseText.trim()) {
    return { ok: false, violations: ['empty response'] };
  }

  // ── 1. Numeric claims must exist in the retrieved context ────────────────
  const contextNumbers = new Set(extractNumbers(contextText).map((n) => n.value));
  for (const num of extractNumbers(responseText)) {
    if (isBenignNumber(num, num.raw, responseText)) continue;
    if (!contextNumbers.has(num.value)) {
      violations.push(`number not in context: "${num.raw}"`);
    }
  }

  // ── 2. Catalog products referenced must be products we provided ──────────
  const { products: catalog } = getFullKnowledgeBase();
  const allowedTitles = (products || []).map((p) => p.title.toLowerCase());
  const responseLower = responseText.toLowerCase();

  for (const p of catalog) {
    if (!responseLower.includes(p.title.toLowerCase())) continue;
    if (!allowedTitles.includes(p.title.toLowerCase())) {
      violations.push(`references a product that was not retrieved: "${p.title}"`);
    }
  }

  return { ok: violations.length === 0, violations };
}

module.exports = { validateGrounding, extractNumbers };
