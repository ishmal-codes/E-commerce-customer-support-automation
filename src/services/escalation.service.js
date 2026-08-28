'use strict';

const axios = require('axios');
const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * escalation.service.js
 * Handles:
 *   1. Detecting whether a user message should trigger human escalation.
 *   2. Notifying founders via Discord webhook and/or SMTP email.
 *
 * Escalation triggers:
 *   A. Keyword-based: refund, payment dispute, chargeback, legal, fraud, etc.
 *   B. Low-confidence: LLM response contains uncertainty markers.
 *   C. Explicit caller signal: controller can pass forceEscalate = true.
 */

// ── Escalation keyword list ─────────────────────────────────────────────────
const ESCALATION_KEYWORDS = [
  // Financial / payment issues
  'refund', 'reimbursement', 'money back', 'charge back', 'chargeback',
  'dispute', 'billing error', 'overcharged', 'double charged', 'unauthorized charge',
  'payment failed', 'payment issue', 'payment problem', 'not charged correctly',

  // Legal / regulatory
  'sue', 'lawsuit', 'legal action', 'lawyer', 'attorney', 'court', 'regulatory',
  'consumer protection', 'trading standards', 'ftc', 'bbb', 'better business',

  // Fraud / stolen
  'fraud', 'stolen', 'scam', 'fake product', 'counterfeit', 'identity theft',
  'reported lost', 'fraudulent',

  // High frustration signals
  'this is unacceptable', 'terrible service', 'worst experience', 'going viral',
  'social media', 'news report', 'expose you', 'i demand',

  // Explicit human request
  'speak to a human', 'talk to a person', 'real person', 'live agent',
  'human support', 'escalate', 'supervisor', 'manager',
];

// ── LLM low-confidence markers ─────────────────────────────────────────────
const LOW_CONFIDENCE_MARKERS = [
  "i'm not sure",
  "i don't know",
  "i cannot determine",
  "i don't have enough information",
  "i'm unable to",
  "i cannot help with",
  "beyond my knowledge",
  "i'm not certain",
  'please contact',
  'you should reach out',
];

/**
 * Determine whether a user message should trigger escalation.
 *
 * @param {string} userMessage - Raw user input
 * @param {string} [llmResponse] - Optional: the LLM's draft response (for confidence check)
 * @param {boolean} [forceEscalate] - Hard override from controller
 * @returns {{ shouldEscalate: boolean, reason: string }}
 */
function detectEscalation(userMessage, llmResponse = '', forceEscalate = false) {
  if (forceEscalate) {
    return { shouldEscalate: true, reason: 'forced_by_controller' };
  }

  const messageLower = userMessage.toLowerCase();
  const responseLower = (llmResponse || '').toLowerCase();

  // Keyword check on user message
  const triggeredKeyword = ESCALATION_KEYWORDS.find((kw) => messageLower.includes(kw));
  if (triggeredKeyword) {
    return { shouldEscalate: true, reason: `keyword_match: "${triggeredKeyword}"` };
  }

  // Low-confidence check on LLM response
  if (llmResponse) {
    const uncertaintyMarker = LOW_CONFIDENCE_MARKERS.find((m) => responseLower.includes(m));
    if (uncertaintyMarker) {
      return { shouldEscalate: true, reason: `low_confidence: "${uncertaintyMarker}"` };
    }
  }

  return { shouldEscalate: false, reason: 'none' };
}

/**
 * Send an escalation notification to all configured channels.
 * Fires-and-forgets — does NOT await or block the chat response.
 *
 * @param {object} escalationData
 * @param {string} escalationData.sessionId
 * @param {string} escalationData.userMessage
 * @param {string} escalationData.reason
 * @param {string} [escalationData.customerEmail]
 * @param {string} [escalationData.llmResponse]
 */
async function sendEscalationNotification(escalationData) {
  const { sessionId, userMessage, reason, customerEmail, llmResponse } = escalationData;

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
  const preview = userMessage.length > 200 ? `${userMessage.slice(0, 200)}…` : userMessage;

  const notifyPromises = [];

  // ── Discord webhook ───────────────────────────────────────────────────────
  if (config.escalation.discord.enabled && config.escalation.discord.webhookUrl) {
    notifyPromises.push(_sendDiscordNotification({ sessionId, preview, reason, customerEmail, timestamp }));
  }

  // ── Email notification ────────────────────────────────────────────────────
  if (config.escalation.email.enabled && config.escalation.email.notifyEmails.length > 0) {
    notifyPromises.push(
      _sendEmailNotification({ sessionId, userMessage, reason, customerEmail, llmResponse, timestamp })
    );
  }

  // Non-blocking: log errors but don't crash the chat response
  Promise.allSettled(notifyPromises).then((results) => {
    results.forEach((r) => {
      if (r.status === 'rejected') {
        console.error('[Escalation] Notification failed:', r.reason?.message || r.reason);
      }
    });
  });
}

// ── Private: Discord ─────────────────────────────────────────────────────────

async function _sendDiscordNotification({ sessionId, preview, reason, customerEmail, timestamp }) {
  const embed = {
    title: '🚨 Customer Escalation Required',
    color: 0xff4444,
    fields: [
      { name: 'Session ID', value: sessionId, inline: true },
      { name: 'Time (UTC)', value: timestamp, inline: true },
      { name: 'Customer Email', value: customerEmail || 'Not provided', inline: true },
      { name: 'Escalation Reason', value: reason, inline: false },
      { name: 'Customer Message', value: `> ${preview}`, inline: false },
    ],
    footer: { text: `${config.store.name} — Support Bot` },
  };

  await axios.post(config.escalation.discord.webhookUrl, { embeds: [embed] }, { timeout: 5000 });
  console.log(`[Escalation] Discord notification sent for session ${sessionId}`);
}

// ── Private: Email ────────────────────────────────────────────────────────────

let _transporter = null;

function _getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: config.escalation.email.smtpHost,
    port: config.escalation.email.smtpPort,
    secure: config.escalation.email.smtpSecure,
    auth: {
      user: config.escalation.email.smtpUser,
      pass: config.escalation.email.smtpPass,
    },
  });
  return _transporter;
}

async function _sendEmailNotification({
  sessionId, userMessage, reason, customerEmail, llmResponse, timestamp,
}) {
  const transporter = _getTransporter();
  const recipients = config.escalation.email.notifyEmails.join(', ');

  const html = `
    <h2 style="color:#d32f2f;">🚨 Chatbot Escalation Alert</h2>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold;width:160px">Time (UTC)</td><td style="padding:6px">${timestamp}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Session ID</td><td style="padding:6px">${sessionId}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Customer Email</td><td style="padding:6px">${customerEmail || 'Not provided'}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Reason</td><td style="padding:6px">${reason}</td></tr>
    </table>
    <h3>Customer Message</h3>
    <blockquote style="border-left:4px solid #d32f2f;padding:8px 12px;background:#fff3f3">${userMessage}</blockquote>
    ${llmResponse ? `<h3>Bot's Draft Response</h3><blockquote style="border-left:4px solid #888;padding:8px 12px">${llmResponse}</blockquote>` : ''}
    <p style="color:#666;font-size:12px">— ${config.store.name} Support Bot</p>
  `;

  await transporter.sendMail({
    from: `"${config.store.shortName} Support Bot" <${config.escalation.email.fromEmail}>`,
    to: recipients,
    subject: `[ESCALATION] Customer Support Required — Session ${sessionId}`,
    html,
  });

  console.log(`[Escalation] Email notification sent to: ${recipients} for session ${sessionId}`);
}

module.exports = { detectEscalation, sendEscalationNotification };
