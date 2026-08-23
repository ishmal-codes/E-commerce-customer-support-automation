'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseProductCatalog } = require('../utils/csvParser');

/**
 * knowledgeBase.service.js
 * Parses and serves all policy/FAQ/product knowledge at startup.
 * Everything lives in memory as structured JS objects — no vector DB needed.
 *
 * Singleton pattern: the KB is parsed once and cached for the process lifetime.
 */

let _kb = null; // Internal singleton cache

// ── Raw policy text storage ──────────────────────────────────────────────────
let _shippingPolicy = '';
let _returnsPolicy = '';
let _faqEntries = [];    // [{ id, question, answer, keywords }]
let _products = [];      // Parsed from product_catalog.csv

/**
 * Parse the FAQ.txt file into structured entries.
 * Format expected: numbered list with Q and A separated by blank lines.
 */
function parseFaq(rawText) {
  const entries = [];
  // Split on numbered items: "1. ...", "2. ...", etc.
  const blocks = rawText.split(/\r?\n(?=\d+\.\s)/);

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // First line: "1. Question text"
    const questionMatch = lines[0].match(/^\d+\.\s+(.+)/);
    if (!questionMatch) continue;

    const question = questionMatch[1].trim();
    const answer = lines.slice(1).join(' ').trim();

    if (!question || !answer) continue;

    // Derive keywords from the question for simple relevance matching
    const keywords = question
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter((w) => w.length > 3);

    entries.push({ id: entries.length + 1, question, answer, keywords });
  }
  return entries;
}

/**
 * Initialise the knowledge base. Called once at server startup.
 * Idempotent — calling multiple times returns the cached instance.
 */
function initKnowledgeBase() {
  if (_kb) return _kb;

  const docsDir = config.paths.docs;

  // ── Shipping policy ──────────────────────────────────────────────────────
  const shippingPath = path.join(docsDir, 'Shipping_Policy.txt');
  _shippingPolicy = fs.existsSync(shippingPath)
    ? fs.readFileSync(shippingPath, 'utf8').trim()
    : '';

  // ── Returns & exchanges policy ───────────────────────────────────────────
  const returnsPath = path.join(docsDir, 'Returns_and_Exchange_Policy.txt');
  _returnsPolicy = fs.existsSync(returnsPath)
    ? fs.readFileSync(returnsPath, 'utf8').trim()
    : '';

  // ── FAQ ──────────────────────────────────────────────────────────────────
  const faqPath = path.join(docsDir, 'FAQ.txt');
  if (fs.existsSync(faqPath)) {
    const rawFaq = fs.readFileSync(faqPath, 'utf8');
    _faqEntries = parseFaq(rawFaq);
  }

  // ── Product catalog ──────────────────────────────────────────────────────
  const catalogPath = path.join(docsDir, 'product_catalog.csv');
  if (fs.existsSync(catalogPath)) {
    _products = parseProductCatalog(catalogPath);
  }

  _kb = {
    shippingPolicy: _shippingPolicy,
    returnsPolicy: _returnsPolicy,
    faqEntries: _faqEntries,
    products: _products,
  };

  console.log(
    `✅ Knowledge base loaded: ${_faqEntries.length} FAQ entries, ` +
    `${_products.length} products, shipping + returns policies.`
  );

  return _kb;
}

/**
 * Detect which knowledge domains are relevant to a user's message.
 * Returns a structured context object for the prompt builder.
 *
 * @param {string} message - The raw user message
 * @returns {{ shipping: string|null, returns: string|null, faq: object[], products: object[] }}
 */
function getRelevantContext(message) {
  const kb = _kb || initKnowledgeBase();
  const lower = message.toLowerCase();

  const context = {
    shipping: null,
    returns: null,
    faq: [],
    products: [],
  };

  // ── Shipping relevance ────────────────────────────────────────────────────
  const shippingKeywords = [
    'ship', 'deliver', 'track', 'tracking', 'dispatch', 'transit',
    'arrival', 'international', 'domestic', 'express', 'standard',
    'how long', 'when will', 'customs', 'duty',
  ];
  if (shippingKeywords.some((kw) => lower.includes(kw))) {
    context.shipping = kb.shippingPolicy;
  }

  // ── Returns/exchanges relevance ───────────────────────────────────────────
  const returnsKeywords = [
    'return', 'exchange', 'refund', 'send back', 'swap', 'replace',
    'defective', 'damaged', 'broken', 'faulty', 'wrong product',
    'dead on arrival', 'doa', 'warranty', '14 day', 'money back',
  ];
  if (returnsKeywords.some((kw) => lower.includes(kw))) {
    context.returns = kb.returnsPolicy;
  }

  // ── FAQ matching ──────────────────────────────────────────────────────────
  const queryWords = lower.replace(/[^a-z0-9 ]/g, '').split(' ').filter((w) => w.length > 3);
  const faqMatches = kb.faqEntries
    .map((entry) => {
      const overlapCount = entry.keywords.filter((kw) => queryWords.includes(kw)).length;
      // Also check if the question itself partially appears in the message
      const questionLower = entry.question.toLowerCase();
      const partialMatch = queryWords.some((w) => questionLower.includes(w)) ? 1 : 0;
      return { entry, score: overlapCount + partialMatch };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3) // Top 3 relevant FAQs
    .map(({ entry }) => entry);

  context.faq = faqMatches;

  // ── Product relevance ─────────────────────────────────────────────────────
  const productKeywords = [
    'iphone', 'airpods', 'case', 'charger', 'cable', 'adapter',
    'price', 'cost', 'available', 'color', 'storage', 'capacity',
    'buy', 'purchase', 'stock', 'in stock', 'titanium', 'pro', 'plus',
    'se', '128gb', '256gb', '512gb', '1tb', 'black', 'blue', 'pink',
    'green', 'yellow', 'white', 'natural', 'midnight', 'starlight',
  ];

  if (productKeywords.some((kw) => lower.includes(kw))) {
    // Filter products by name match
    const matchedProducts = kb.products.filter((p) => {
      const titleLower = p.title.toLowerCase();
      const descLower = p.description.toLowerCase();
      return queryWords.some((w) => titleLower.includes(w) || descLower.includes(w));
    });

    // If specific match found use those; else return top 3 by relevance score
    context.products = matchedProducts.slice(0, 3);

    // If no product title matched but product keywords present, include all products briefly
    if (context.products.length === 0 && productKeywords.some((kw) => lower.includes(kw))) {
      context.products = kb.products.slice(0, 5);
    }
  }

  return context;
}

/**
 * Look up a product by name, SKU, or partial title match.
 * Used by the product endpoint.
 *
 * @param {string} query
 * @returns {object[]}
 */
function searchProducts(query) {
  const kb = _kb || initKnowledgeBase();
  const lower = query.toLowerCase();

  return kb.products.filter((p) => {
    if (p.title.toLowerCase().includes(lower)) return true;
    if (p.handle.toLowerCase().includes(lower)) return true;
    if (p.description.toLowerCase().includes(lower)) return true;
    // Check variant SKUs and colors
    return p.variants.some(
      (v) =>
        v.sku.toLowerCase().includes(lower) ||
        v.color.toLowerCase().includes(lower) ||
        v.storage.toLowerCase().includes(lower)
    );
  });
}

/**
 * Get the full knowledge base (for debugging / admin).
 */
function getFullKnowledgeBase() {
  return _kb || initKnowledgeBase();
}

module.exports = { initKnowledgeBase, getRelevantContext, searchProducts, getFullKnowledgeBase };
