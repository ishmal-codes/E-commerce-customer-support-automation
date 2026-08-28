'use strict';

const config = require('../config');

/**
 * promptBuilder.js
 * Assembles the full system prompt and user-facing conversation context
 * that gets sent to the LLM for each request.
 *
 * Strategy:
 *  1. System prompt anchors the bot's identity, store context, and constraints.
 *  2. Relevant knowledge base sections are injected based on detected intent.
 *  3. Shopify / order data is injected if an order lookup was performed.
 *  4. Conversation history provides context continuity.
 */

const STORE_NAME = config.store.name;
const STORE_URL = `https://${config.shopify.storeDomain}`;

/**
 * Build the static system prompt.
 * This is sent as the "system" role in every conversation.
 *
 * @param {object} knowledgeContext - Relevant KB snippets for this query
 * @param {object|null} orderContext - Resolved order data (or null)
 * @param {object|null} productContext - Resolved product data (or null)
 * @returns {string} Full system prompt text
 */
function buildSystemPrompt(knowledgeContext = {}, orderContext = null, productContext = null) {
  const sections = [];

  // ── Core identity ────────────────────────────────────────────────────────
  sections.push(`You are a helpful, professional AI customer support assistant for ${STORE_NAME} (${STORE_URL}).
You specialise in Apple iPhones, accessories, order tracking, shipping, and return/exchange policies.
You are friendly, concise, and accurate. You never guess — if you're unsure, you say so honestly.
You never handle refunds, payment disputes, chargebacks, or billing adjustments — those are always escalated to a human.

Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`);

  // ── Scope boundaries ─────────────────────────────────────────────────────
  sections.push(`## What you CAN help with
- Order status and tracking
- Shipping timelines and costs
- Return and exchange eligibility and process
- Product details, pricing, colors, storage options, and availability
- Pre-sale questions about Apple devices and accessories
- General FAQ about the store

## What you CANNOT handle (always escalate)
- Refund processing or approval
- Payment disputes, chargebacks, or billing errors
- Account suspension, fraud flags, or lost/stolen device reports
- Legal complaints or regulatory inquiries
- Any issue you do not have clear, accurate information about`);

  // ── Knowledge base injection ─────────────────────────────────────────────
  if (knowledgeContext.shipping) {
    sections.push(`## Shipping Policy\n${knowledgeContext.shipping}`);
  }

  if (knowledgeContext.returns) {
    sections.push(`## Returns & Exchange Policy\n${knowledgeContext.returns}`);
  }

  if (knowledgeContext.faq && knowledgeContext.faq.length > 0) {
    const faqText = knowledgeContext.faq
      .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n\n');
    sections.push(`## Frequently Asked Questions\n${faqText}`);
  }

  // ── Order context injection ───────────────────────────────────────────────
  if (orderContext) {
    sections.push(`## Customer Order Information (LIVE DATA — use this to answer the customer)
Order ID: ${orderContext.orderId}
Customer: ${orderContext.customerName || 'N/A'}
Products: ${orderContext.products}
Order Date: ${orderContext.orderDate}
Status: ${orderContext.status}
Tracking Number: ${orderContext.trackingNumber || 'Not yet assigned'}
${orderContext.trackingNumber ? `The customer can track this shipment using the tracking number above on the carrier's website.` : ''}
${orderContext.fulfillmentStatus ? `Fulfillment Status: ${orderContext.fulfillmentStatus}` : ''}
${orderContext.financialStatus ? `Payment Status: ${orderContext.financialStatus}` : ''}`.trim());
  }

  // ── Product context injection ─────────────────────────────────────────────
  if (productContext && productContext.length > 0) {
    const productLines = productContext.map((p) => {
      const inStockVariants = p.variants.filter((v) => v.inventory > 0);
      const allColors = [...new Set(p.variants.map((v) => v.color).filter(Boolean))];
      const allStorage = [...new Set(p.variants.map((v) => v.storage).filter(Boolean))];
      const priceRange = p.variants.length > 0
        ? `$${Math.min(...p.variants.map((v) => v.price))} – $${Math.max(...p.variants.map((v) => v.price))}`
        : 'Price TBD';

      return `Product: ${p.title}
  Description: ${p.description}
  Price: ${priceRange}
  Available Colors: ${allColors.join(', ') || 'N/A'}
  Storage Options: ${allStorage.join(', ') || 'N/A'}
  In-Stock Variants: ${inStockVariants.length} of ${p.variants.length}`;
    });
    sections.push(`## Product Catalog (Relevant Results)\n${productLines.join('\n\n')}`);
  }

  // ── Response instructions ─────────────────────────────────────────────────
  sections.push(`## Response Guidelines
- Answer the exact user query directly and concisely using live store data. If asked about stock, state availability first (e.g. 'Yes, both are in stock'). Do not add generic filler, unrelated marketing copy, or unprompted product usage instructions.
- Be concise, direct, and factual. Use plain English, avoid fluff.
- If answering about an order, always confirm the order ID in your response.
- If a customer asks about something outside your scope, acknowledge their concern warmly and let them know a human team member will assist.
- Never fabricate order numbers, tracking data, or policies not listed above.
- Keep responses under 150 words unless the question genuinely requires more detail.`);

  return sections.join('\n\n---\n\n');
}

/**
 * Format conversation history for the LLM messages array.
 * @param {Array<{role: string, content: string}>} history
 * @returns {Array<{role: string, content: string}>}
 */
function buildConversationHistory(history = []) {
  // Groq and Gemini both accept { role: 'user'|'model'/'assistant', content: string }
  return history.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));
}

module.exports = { buildSystemPrompt, buildConversationHistory };
