'use strict';

/**
 * plainText.js
 * Sanitizes LLM output for the plain-text chat widget.
 *
 * The frontend renders NO markdown — any emphasis/heading/code syntax the
 * LLM slips past the system-prompt formatting rules would reach the customer
 * as literal symbols (e.g. "**Processing**"). This strips the syntax while
 * preserving every word of the actual answer.
 */

/**
 * Remove markdown syntax from a response, keeping the underlying text intact.
 * @param {string} text - Raw LLM response.
 * @returns {string} Plain-text version safe for the chat widget.
 */
function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text;

  // Links: [label](url) → label (url)
  out = out.replace(/\[([^\]]*)\]\(([^)]+)\)/g, '$1 ($2)');

  // Code fences: drop the ``` markers, keep the content
  out = out.replace(/```[\w-]*[ \t]*\r?\n?/g, '');

  // Bold emphasis: **word** / __word__ → word
  out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
  out = out.replace(/__([^_]+)__/g, '$1');

  // Italic emphasis: *word* / _word_ (only when used as paired emphasis,
  // so identifiers like sku_123 keep their underscores)
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/gm, '$1$2');
  out = out.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/gm, '$1$2');

  // Headings at line start: "## Title" → "Title"
  out = out.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');

  // Markdown list bullets: "* item" → "- item" (plain bullets already OK)
  out = out.replace(/^([ \t]*)\*[ \t]+/gm, '$1- ');

  // Stray emphasis markers that escaped the paired rules above
  out = out.replace(/[*`]/g, '');

  return out;
}

module.exports = { stripMarkdown };
