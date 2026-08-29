/**
 * Trevolk Support Bot — Function-calling tools (tool-use layer)
 *
 * The LLM decides WHICH tool to call and with WHAT arguments; this module
 * executes those calls against the REAL data sources (CSV catalog, customer
 * orders CSV, Shopify Admin API, policy files). The LLM then composes its
 * answer ONLY from the JSON results returned here.
 *
 * Why this exists: the previous pre-retrieval pipeline guessed the user's
 * intent from keywords BEFORE the LLM ever saw the message, so valid
 * questions phrased unexpectedly ("wireless buds", "installments") got no
 * data. With tool use, the LLM interprets the message first and pulls
 * exactly what it needs — including chained calls (search → details).
 *
 * Tools provided:
 *   search_products(query)                     fuzzy catalog search
 *   get_product_details(product_id)            one product, full data
 *   get_highest_priced_product()               max-price product
 *   get_lowest_priced_product()                min-price product
 *   get_products_in_stock()                    available inventory
 *   get_order_status(order_id)                 Shopify API → CSV fallback
 *   get_policy(topic)                          shipping / returns / FAQ
 *   get_store_info()                           contact hours etc.
 *
 * Data layering: catalog + CSV orders + policies live in knowledgeBase
 * (loaded from docs/ at boot). Live order data goes through shopify.service.
 */

const path = require('path');
const config = require('../config/index');
const knowledgeBase = require('./knowledgeBase.service');
const orderLookup = require('./orderLookup.service');
const shopify = require('./shopify.service');

/** All tools read products from the knowledge base singleton. */
function getProducts() {
  return knowledgeBase.getFullKnowledgeBase().products || [];
}

/* --------------------------------------------------------------------- */
/* Text utilities: tokenizer, stemmer, edit distance                      */
/* --------------------------------------------------------------------- */

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'have',
  'has', 'had', 'i', 'you', 'we', 'they', 'he', 'she', 'it', 'me', 'my',
  'your', 'our', 'to', 'of', 'in', 'on', 'for', 'with', 'and', 'or', 'at',
  'by', 'from', 'can', 'could', 'will', 'would', 'should', 'shall', 'may',
  'this', 'that', 'these', 'those', 'there', 'here', 'what', 'which', 'who',
  'whom', 'how', 'why', 'when', 'where', 'about', 'want', 'need', 'please',
  'show', 'tell', 'get', 'buy', 'look', 'looking', "i'm", 'im', 'id', 'buying',
]);

/** "iPhone 15 Pro's Case!" → ["iphone", "15", "pro's", "case"] */
function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/['\u2019]s\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Light plural/suffix stemmer so "cases"~"case", "earbuds"~"earbud". */
function stem(word) {
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function tokenize(text) {
  return normalizeText(text)
    .split(' ')
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

/** Strip a stray trailing quote/apostrophe from an LLM-supplied arg. */
function cleanToken(t) {
  return String(t || '').toLowerCase().replace(/['"\u2019]+$/, '');
}

function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 1) return 2;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}

/**
 * A query token matches a target token when:
 *   - exact match, OR
 *   - either stem matches, OR
 *   - Levenshtein distance <= 1 (typo tolerance; only for tokens >= 7 chars
 *     so short model codes like "se" never fuzz-match), OR
 *   - PREFIX match with a length guard (min 4 chars, shorter token at least
 *     60% of the longer) so "charge" finds "charger"/"charging" and
 *     "return" finds "returned" — but "payments" can never match
 *     "shipment"/"information" via loose substring containment.
 */
function tokenMatches(queryToken, targetToken) {
  const q = cleanToken(queryToken);
  const t = cleanToken(targetToken);
  if (!q || !t) return false;
  if (t === q) return true;
  if (t === stem(q) || stem(t) === stem(q)) return true;
  if (q.length >= 7 && t.length >= 7 && editDistance(q, t) <= 1) return true;
  const shorter = q.length < t.length ? q : t;
  const longer = q.length < t.length ? t : q;
  if (shorter.length >= 4 && longer.startsWith(shorter) && shorter.length >= longer.length * 0.6) {
    return true;
  }
  return false;
}

/* --------------------------------------------------------------------- */
/* Query synonym expansion                                                */
/*                                                                       */
/* Generic category words people use for products in this catalog. Pure  */
/* catalog-shape knowledge ("people call AirPods 'buds'") — NOT answer   */
/* knowledge. Expansion only adds candidate keywords; results still come */
/* exclusively from the catalog, and generic-only queries still return   */
/* empty when nothing fits (search_products never fabricates matches).   */
/* --------------------------------------------------------------------- */

const QUERY_SYNONYMS = {
  buds: ['earbuds', 'airpods'],
  earbud: ['earbuds', 'airpods'],
  headphone: ['headphones', 'airpods'],
  phone: ['iphone'],
  smartphone: ['iphone'],
  laptop: ['macbook'],
  notebook: ['macbook'],
  charger: ['adapter', 'charging'],
  wire: ['cable'],
  installment: ['financing'],
  emi: ['financing'],
};

/* --------------------------------------------------------------------- */
/* Product search index                                                   */
/* --------------------------------------------------------------------- */

let productIndex = [];

function buildProductIndex() {
  productIndex = getProducts().map((p) => {
    const titleTerms = tokenize(p.title || '');
    const handleTerms = normalizeText(p.handle || '').split(' ').filter(Boolean);
    const tagTerms = (p.tags || '').split(',').flatMap((t) => tokenize(t));
    const typeTerms = tokenize(p.type || '');
    // Strong terms: title/handle/tags/type — a match here counts as a hit.
    const strongTerms = [...new Set([...titleTerms, ...handleTerms, ...tagTerms, ...typeTerms])];
    // Weak terms: description — only used as a tie-breaker for scoring.
    const descTerms = tokenize(p.description || '');
    return { product: p, strongTerms, descTerms };
  });
}

/** Compact, complete product view returned to the LLM. */
function productSummary(p) {
  return {
    product_id: p.handle,
    name: p.title,
    category: p.type || null,
    description: p.description || null,
    tags: p.tags || null,
    in_stock: (p.variants || []).some((v) => v.inventory > 0),
    variants: (p.variants || []).map((v) => ({
      name: [v.color, v.storage].filter(Boolean).join(' / ') || 'Default',
      price: v.price,
      in_stock: v.inventory > 0,
      stock_qty: v.inventory,
    })),
  };
}

/* --------------------------------------------------------------------- */
/* Tool implementations                                                   */
/* --------------------------------------------------------------------- */

/**
 * Fuzzy product search. Returns compact matches (top 5). An empty result
 * is a VALID answer — the LLM must turn it into the honest refusal, never
 * a guess.
 */
function searchProducts({ query }) {
  if (!productIndex.length) buildProductIndex();
  const queryTokens = tokenize(query);
  const expanded = [...new Set([...queryTokens, ...queryTokens.flatMap((t) => QUERY_SYNONYMS[stem(t)] || [])])];

  if (expanded.length === 0) return { matches: [], note: 'The search query was empty.' };

  const scored = [];
  for (const { product, strongTerms, descTerms } of productIndex) {
    let strongHits = 0;
    for (const qt of expanded) {
      if (strongTerms.some((t) => tokenMatches(qt, t))) strongHits++;
    }
    if (strongHits === 0) continue;
    let descHits = 0;
    for (const qt of expanded) {
      if (descTerms.some((t) => tokenMatches(qt, t))) descHits++;
    }
    scored.push({ product, score: strongHits * 2 + descHits * 0.5 });
  }

  scored.sort((a, b) => b.score - a.score);
  if (!scored.length) {
    return {
      matches: [],
      note: `No products matched the search for "${query}". The catalog genuinely has no match — do not invent products or prices.`,
    };
  }

  // Drop weak tail results: keep items within 60% of the best score.
  const best = scored[0].score;
  const kept = scored.filter((s) => s.score >= best * 0.6).slice(0, 5);
  return { matches: kept.map((s) => productSummary(s.product)) };
}

/**
 * Full details for one product by product_id (the product's handle, as
 * returned by search_products). Explicit not-found on a bad id — the LLM
 * must never make up data for a product that doesn't exist.
 */
function getProductDetails({ product_id }) {
  if (!productIndex.length) buildProductIndex();
  const id = normalizeText(product_id).replace(/\s+/g, '-');
  const found = getProducts().find((p) => p.handle === id || p.handle === normalizeText(product_id));
  if (!found) {
    return { found: false, product_id, note: 'This product_id does not exist in the catalog. Do not guess details — use search_products first.' };
  }
  return { found: true, product: productSummary(found) };
}

/** Highest (or lowest) priced product across ALL variants. */
function _extremePriceProducts(direction) {
  if (!productIndex.length) buildProductIndex();
  const products = getProducts();
  let bestPrice = direction === 'max' ? -Infinity : Infinity;
  for (const p of products) {
    for (const v of p.variants || []) {
      if (v.price == null) continue;
      if (direction === 'max' ? v.price > bestPrice : v.price < bestPrice) bestPrice = v.price;
    }
  }
  if (!isFinite(bestPrice)) return { found: false, note: 'No priced products in catalog.' };

  const winners = [];
  for (const p of products) {
    const priced = (p.variants || []).filter((v) => v.price === bestPrice);
    if (priced.length) {
      winners.push({
        product_id: p.handle,
        name: p.title,
        priced_variants: priced.map((v) => ({
          name: [v.color, v.storage].filter(Boolean).join(' / ') || 'Default',
          price: v.price,
          in_stock: v.inventory > 0,
        })),
        in_stock: priced.some((v) => v.inventory > 0),
      });
    }
  }
  return { price: bestPrice, products: winners };
}

function getHighestPricedProduct() {
  return _extremePriceProducts('max');
}

function getLowestPricedProduct() {
  return _extremePriceProducts('min');
}

/** In-stock products with their starting (lowest variant) price. */
function getProductsInStock() {
  if (!productIndex.length) buildProductIndex();
  const inStock = getProducts()
    .filter((p) => (p.variants || []).some((v) => v.inventory > 0))
    .map((p) => {
      const prices = (p.variants || []).map((v) => v.price).filter((x) => x != null);
      return { product_id: p.handle, name: p.title, starting_price: prices.length ? Math.min(...prices) : null };
    });
  return { count: inStock.length, products: inStock };
}

/**
 * Order status with the project's mandatory layering:
 * Shopify Admin API first (when configured), then local CSV fallback.
 * NOT FOUND is a valid, honest answer — the LLM must report it verbatim
 * and never fabricate a status.
 */
async function getOrderStatus({ order_id }) {
  const id = String(order_id || '').replace(/[#\s]/g, '');
  if (!id) return { found: false, note: 'No order_id was provided. Ask the user for their order number.' };

  if (shopify.isShopifyConfigured()) {
    try {
      const shopifyOrder = await shopify.getOrderById(id);
      if (shopifyOrder) return { found: true, source: 'shopify', order: shopifyOrder };
    } catch (err) {
      console.warn(`[Tools] Shopify order lookup failed for #${id}, falling back to CSV: ${err.message}`);
    }
  }

  const csvOrder = orderLookup.getCsvOrder(id);
  if (csvOrder) return { found: true, source: 'csv', order: csvOrder };

  return {
    found: false,
    order_id: id,
    note: `Order #${id} was not found in our system. Do not guess or fabricate its status. Tell the user exactly that this order was not found and offer to connect them with a human agent.`,
  };
}

/**
 * Policy lookup with loose keyword matching against the store's shipping
 * policy, return policy and FAQ. Multiple docs may be returned when a
 * question spans topics (e.g. "how long do I have to return something"
 * touches the return policy AND the FAQ). No match = valid empty result.
 */
function getPolicy({ topic }) {
  const kb = knowledgeBase.getFullKnowledgeBase();
  const rawTokens = tokenize(topic);
  // Synonym expansion so people's phrasing maps onto policy vocabulary.
  const topicTokens = [...new Set([...rawTokens, ...rawTokens.flatMap((t) => QUERY_SYNONYMS[stem(t)] || [])])];
  if (!rawTokens.length) return { found: false, available_topics: ['shipping', 'returns', 'faq'] };

  const sections = [];

  const SHIPPING_WORDS = ['ship', 'shipping', 'delivery', 'deliver', 'dispatch', 'postage', 'courier', 'arrive', 'arrival', 'carrier', 'tracking'];
  if (topicTokens.some((t) => SHIPPING_WORDS.some((w) => tokenMatches(t, w)))) {
    sections.push({ section: 'shipping_policy', content: kb.shippingPolicy });
  }

  const RETURNS_WORDS = ['return', 'refund', 'exchange', 'cancel', 'warranty', 'money', 'back', 'replace', 'replacement', 'damaged', 'broken', 'wrong'];
  if (topicTokens.some((t) => RETURNS_WORDS.some((w) => tokenMatches(t, w)))) {
    sections.push({ section: 'returns_policy', content: kb.returnsPolicy });
  }

  const hits = [];
  for (const faq of kb.faqEntries || []) {
    const haystack = normalizeText(`${faq.question} ${faq.answer}`);
    const faqTokens = haystack.split(' ').filter(Boolean);
    let matched = 0;
    for (const qt of topicTokens) {
      if (faqTokens.some((ft) => tokenMatches(qt, ft))) matched++;
    }
    // Loose threshold: >= 2 topic-token matches (or >= 1 for 1-word topics).
    const threshold = rawTokens.length >= 2 ? 2 : 1;
    if (matched >= threshold) hits.push({ question: faq.question, answer: faq.answer });
  }
  if (hits.length) sections.push({ section: 'faq', entries: hits.slice(0, 3) });

  if (!sections.length) {
    return {
      found: false,
      note: `No policy or FAQ entry matched the topic "${topic}". This question is not covered by the store's documented policies. Do not invent a policy — use the honest refusal and offer a human agent.`,
      available_topics: ['shipping', 'returns', 'faq'],
    };
  }
  return { found: true, sections };
}

/** Static store metadata (store name, support email). */
function getStoreInfo() {
  return {
    store_name: config.store.name,
    support_email: config.store.supportEmail,
  };
}

/* --------------------------------------------------------------------- */
/* Tool definitions (Gemini functionDeclaration format — single source). */
/* Groq wrappers are generated from these via toGroqTools().              */
/* --------------------------------------------------------------------- */

const TOOL_DEFINITIONS = [
  {
    name: 'search_products',
    description:
      "Search the store catalog by fuzzy keyword. Use for any product question ('AirPods', 'earbuds', 'wireless buds', 'iPhone 15'). Returns up to 5 matching products with prices and stock. An empty matches array is a valid result.",
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product keywords from the user message, e.g. "AirPods" or "wireless earbuds"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product_details',
    description:
      'Get full details (description, all variants, prices, stock) for one product by its product_id obtained from search_products.',
    parameters: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'The product_id returned by search_products (e.g. "iphone-15-pro")' },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'get_highest_priced_product',
    description: 'Get the most expensive product in the catalog (highest variant price).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_lowest_priced_product',
    description: 'Get the cheapest product in the catalog (lowest variant price).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_products_in_stock',
    description: 'List all products currently in stock with their starting prices.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_order_status',
    description:
      'Look up a customer order by its order number. ONLY use with the order_id the user actually provided — never guess one. If found=false, the order does not exist in our system; say so honestly.',
    parameters: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'The order number from the user, e.g. "10234"' },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'get_policy',
    description:
      "Look up store policies (shipping, returns/refunds/exchange, warranty) and FAQ entries by loose keyword. Use for ANY policy question, including ones you think you already know ('installments', 'warranty', 'delivery time'). If found=false, the topic is not covered by store policy — never invent an answer.",
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Policy topic keywords, e.g. "return window" or "installment payments"' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'get_store_info',
    description: 'Get store metadata: support email, support hours, store name.',
    parameters: { type: 'object', properties: {} },
  },
];

/** OpenAI/Groq tool format, generated from the same definitions. */
function toGroqTools() {
  return TOOL_DEFINITIONS.map((def) => ({ type: 'function', function: def }));
}

/* --------------------------------------------------------------------- */
/* Dispatcher + result helpers                                            */
/* --------------------------------------------------------------------- */

/**
 * Execute one tool call from the LLM. Always returns a JSON-serializable
 * result — errors become data ("do not guess") instead of crashing the loop.
 */
async function executeTool(name, args = {}) {
  try {
    switch (name) {
      case 'search_products':
        return searchProducts(args);
      case 'get_product_details':
        return getProductDetails(args);
      case 'get_highest_priced_product':
        return getHighestPricedProduct();
      case 'get_lowest_priced_product':
        return getLowestPricedProduct();
      case 'get_products_in_stock':
        return getProductsInStock();
      case 'get_order_status':
        return await getOrderStatus(args);
      case 'get_policy':
        return getPolicy(args);
      case 'get_store_info':
        return getStoreInfo();
      default:
        return { error: `Unknown tool "${name}". Available tools: ${TOOL_DEFINITIONS.map((t) => t.name).join(', ')}` };
    }
  } catch (err) {
    return { error: `Tool ${name} failed: ${err.message}. Do not guess the answer.` };
  }
}

/** One-line human summary of a tool result, for logs and the toolsCalled trace. */
function summarizeToolResult(name, result) {
  if (!result || typeof result !== 'object') return 'no result';
  if (result.error) return `error: ${result.error}`;
  switch (name) {
    case 'search_products':
      return result.matches && result.matches.length
        ? `${result.matches.length} match(es): ${result.matches.map((m) => m.name).join('; ')}`
        : 'no matches';
    case 'get_product_details':
      return result.found ? result.product.name : `not found: ${result.product_id}`;
    case 'get_highest_priced_product':
    case 'get_lowest_priced_product':
      return result.products ? `${result.products.map((p) => p.name).join('; ')} @ $${result.price}` : 'none';
    case 'get_products_in_stock':
      return `${result.count} in stock`;
    case 'get_order_status': {
      if (!result.found) return 'order not found';
      const oid = String(result.order?.orderId || '').replace(/^#/, '');
      return `#${oid} — ${result.order?.status || result.order?.fulfillmentStatus || 'found'} (source: ${result.source})`;
    }
    case 'get_policy':
      return result.found ? `matched: ${result.sections.map((s) => s.section).join(', ')}` : 'no policy match';
    case 'get_store_info':
      return result.store_name || 'store info';
    default:
      return 'ok';
  }
}

/** Extract product titles from a tool result (feeds the grounding validator). */
function extractProductsFromResult(result) {
  if (!result || typeof result !== 'object') return [];
  const out = [];
  if (Array.isArray(result.matches)) result.matches.forEach((m) => out.push({ title: m.name }));
  if (result.product) out.push({ title: result.product.name });
  if (Array.isArray(result.products)) result.products.forEach((p) => out.push({ title: p.name }));
  return out;
}

module.exports = {
  TOOL_DEFINITIONS,
  toGroqTools,
  executeTool,
  summarizeToolResult,
  extractProductsFromResult,
};
