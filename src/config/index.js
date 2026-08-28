'use strict';

const path = require('path');

// Load .env only in non-production environments; Railway injects vars directly.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

/**
 * Centralised, validated configuration object.
 * Every env var the app needs lives here — no process.env scattered through code.
 */
const config = {
  // ── Store identity ──────────────────────────────────────────────────────
  store: {
    name: process.env.STORE_NAME || 'Trevolk Apple Store',
    shortName: process.env.STORE_SHORT_NAME || 'Trevolk',
    supportEmail: process.env.STORE_SUPPORT_EMAIL || 'support@trevolk.shop',
  },

  // ── Server ─────────────────────────────────────────────────────────────
  port: parseInt(process.env.BACKEND_PORT || process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // ── Shopify ────────────────────────────────────────────────────────────
  shopify: {
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN || 'trevolk-apple-demo.myshopify.com',
    adminApiToken: process.env.SHOPIFY_ADMIN_API_TOKEN || '',
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01',
  },

  // ── LLM — Gemini (primary) ─────────────────────────────────────────────
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },

  // ── LLM — Groq (fallback) ──────────────────────────────────────────────
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama3-8b-8192',
  },

  // ── LLM behaviour ─────────────────────────────────────────────────────
  llm: {
    timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS, 10) || 8000,
  },

  // ── Escalation ─────────────────────────────────────────────────────────
  escalation: {
    discord: {
      enabled: process.env.DISCORD_WEBHOOK_ENABLED === 'true',
      webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    },
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      notifyEmails: (process.env.ESCALATION_NOTIFY_EMAILS || '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean),
      fromEmail: process.env.ESCALATION_FROM_EMAIL || 'noreply@trevolk.com',
    },
  },

  // ── Rate limiting ──────────────────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 30,
  },

  // ── Session ────────────────────────────────────────────────────────────
  session: {
    maxTurns: parseInt(process.env.SESSION_MAX_TURNS, 10) || 20,
    ttlMs: parseInt(process.env.SESSION_TTL_MS, 10) || 1_800_000, // 30 min
  },

  // ── Agent desk console ──────────────────────────────────────────────
  desk: {
    secret: process.env.DESK_SECRET || 'trevolk2026',
  },

  // ── Paths ──────────────────────────────────────────────────────────────
  paths: {
    docs: path.resolve(__dirname, '../../docs'),
  },
};

/**
 * Validate that critical secrets are present.
 * Logs warnings (not hard exits) so the server still boots for testing.
 */
function validateConfig() {
  const warnings = [];

  if (!config.shopify.adminApiToken) {
    warnings.push('SHOPIFY_ADMIN_API_TOKEN is not set — Shopify lookups will be unavailable.');
  }
  if (!config.gemini.apiKey) {
    warnings.push('GEMINI_API_KEY is not set — Gemini LLM calls will fail.');
  }
  if (!config.groq.apiKey) {
    warnings.push('GROQ_API_KEY is not set — Groq fallback will be unavailable.');
  }
  if (config.escalation.discord.enabled && !config.escalation.discord.webhookUrl) {
    warnings.push('DISCORD_WEBHOOK_ENABLED=true but DISCORD_WEBHOOK_URL is missing.');
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Config warnings:');
    warnings.forEach((w) => console.warn(`   • ${w}`));
    console.warn('');
  }
}

validateConfig();

module.exports = config;
