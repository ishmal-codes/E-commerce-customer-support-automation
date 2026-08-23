'use strict';

const config = require('../config');

/**
 * session.service.js
 * In-memory session management for conversation history.
 *
 * Each session stores:
 *   - history: array of { role, content } turns
 *   - metadata: customerEmail, createdAt, lastActiveAt, turnCount
 *
 * Sessions auto-expire after SESSION_TTL_MS of inactivity.
 * A sweep runs every 5 minutes to evict stale sessions.
 */

/** @type {Map<string, { history: Array, metadata: object, timer: NodeJS.Timeout }>} */
const sessions = new Map();

const MAX_TURNS = config.session.maxTurns;
const TTL_MS = config.session.ttlMs;

/**
 * Get or create a session.
 * @param {string} sessionId
 * @param {{ customerEmail?: string }} [opts]
 * @returns {{ history: Array, metadata: object }}
 */
function getOrCreateSession(sessionId, opts = {}) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      history: [],
      metadata: {
        customerEmail: opts.customerEmail || null,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        turnCount: 0,
      },
    });
  }

  const session = sessions.get(sessionId);

  // Update customer email if newly provided
  if (opts.customerEmail && !session.metadata.customerEmail) {
    session.metadata.customerEmail = opts.customerEmail;
  }

  // Reset the inactivity timer
  _resetTtl(sessionId);

  return session;
}

/**
 * Append a user or assistant turn to the session history.
 * Trims to MAX_TURNS to avoid runaway context growth.
 *
 * @param {string} sessionId
 * @param {'user'|'model'} role   — use 'model' for assistant (Gemini convention)
 * @param {string} content
 */
function addTurn(sessionId, role, content) {
  const session = getOrCreateSession(sessionId);
  session.history.push({ role, content });
  session.metadata.turnCount += 1;
  session.metadata.lastActiveAt = new Date().toISOString();

  // Keep only the most recent MAX_TURNS turns
  if (session.history.length > MAX_TURNS) {
    session.history = session.history.slice(session.history.length - MAX_TURNS);
  }
}

/**
 * Retrieve the conversation history for a session.
 * @param {string} sessionId
 * @returns {Array<{ role: string, content: string }>}
 */
function getHistory(sessionId) {
  return sessions.get(sessionId)?.history || [];
}

/**
 * Get session metadata.
 * @param {string} sessionId
 * @returns {object|null}
 */
function getMetadata(sessionId) {
  return sessions.get(sessionId)?.metadata || null;
}

/**
 * Explicitly destroy a session (e.g., on user logout or test teardown).
 * @param {string} sessionId
 */
function destroySession(sessionId) {
  const session = sessions.get(sessionId);
  if (session?._timer) clearTimeout(session._timer);
  sessions.delete(sessionId);
}

/**
 * Return count of active sessions (for health/admin).
 * @returns {number}
 */
function getActiveSessionCount() {
  return sessions.size;
}

// ── Internal TTL management ─────────────────────────────────────────────────

function _resetTtl(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  if (session._timer) clearTimeout(session._timer);

  session._timer = setTimeout(() => {
    // Import tokenTracker lazily to avoid circular dependency at load time
    try {
      const tokenTracker = require('../utils/tokenTracker');
      const stats = tokenTracker.getSessionStats(sessionId);
      if (stats) {
        console.log(
          `[Session] Evicting ${sessionId} — ` +
          `${stats.callCount} LLM call(s), ` +
          `$${stats.totalCostUSD.toFixed(6)} total cost.`
        );
        tokenTracker.clearSession(sessionId);
      }
    } catch (_) { /* tokenTracker may not be initialised in tests */ }

    sessions.delete(sessionId);
    console.log(`[Session] Evicted idle session: ${sessionId}`);
  }, TTL_MS);
}

module.exports = {
  getOrCreateSession,
  addTurn,
  getHistory,
  getMetadata,
  destroySession,
  getActiveSessionCount,
};
