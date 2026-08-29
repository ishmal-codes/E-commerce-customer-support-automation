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
 *
 * Consumers: tools.service.js exposes this knowledge to the LLM through
 * function-calling tools (search_products, get_policy, …). No keyword
 * pre-retrieval happens here anymore — the LLM pulls what it needs.
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
 * Get the full knowledge base.
 * Primary consumer is tools.service.js, which exposes products, policies and
 * FAQ to the LLM through function-calling tools.
 */
function getFullKnowledgeBase() {
  return _kb || initKnowledgeBase();
}

module.exports = { initKnowledgeBase, getFullKnowledgeBase };
