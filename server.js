'use strict';

/**
 * server.js
 * Application entry point.
 *
 * Boot order:
 *   1. Load environment config (dotenv via config/index.js)
 *   2. Initialise knowledge base (parse docs at startup — fail fast if files missing)
 *   3. Initialise CSV order data
 *   4. Create Express app with all middleware
 *   5. Mount routes
 *   6. Register error handlers
 *   7. Start HTTP server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./src/config');
const requestLogger = require('./src/middlewares/requestLogger');
const { errorHandler, notFoundHandler } = require('./src/middlewares/errorHandler');
const chatRoutes = require('./src/routes/chat.routes');
const { initKnowledgeBase } = require('./src/services/knowledgeBase.service');
const { initOrderData } = require('./src/services/orderLookup.service');

// ── 1. Pre-boot: Initialise knowledge base and order data ──────────────────
// These are synchronous reads that must succeed before we accept requests.
try {
  initKnowledgeBase();
  initOrderData();
} catch (err) {
  console.error('❌ Fatal: Failed to initialise knowledge base or order data:', err.message);
  process.exit(1);
}

// ── 2. Create Express app ──────────────────────────────────────────────────
const app = express();

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────
// In production, replace '*' with your frontend domain.
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Request logging ────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Trust proxy (Railway / Railway-behind-proxy) ───────────────────────────
app.set('trust proxy', 1);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api', chatRoutes);

// Root ping (useful for Railway's health check URL)
app.get('/', (req, res) => {
  res.json({
    service: `${config.store.name} — Customer Support Chatbot API`,
    version: require('./package.json').version,
    status: 'running',
    docs: 'POST /api/chat | GET /api/health',
  });
});

// ── 404 and error handlers (must be last) ──────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── 3. Start server ────────────────────────────────────────────────────────
const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Customer Support Bot API running on port ${PORT}`);
  console.log(`   Environment  : ${config.nodeEnv}`);
  console.log(`   Shopify store: ${config.shopify.storeDomain}`);
  console.log(`   Gemini model : ${config.gemini.model}`);
  console.log(`   Groq model   : ${config.groq.model} (fallback)`);
  console.log(`   Discord alert: ${config.escalation.discord.enabled ? '✅ enabled' : '❌ disabled'}`);
  console.log(`   Email alert  : ${config.escalation.email.enabled ? '✅ enabled' : '❌ disabled'}`);
  console.log(`\n   Health check : http://localhost:${PORT}/api/health`);
  console.log(`   Chat endpoint: POST http://localhost:${PORT}/api/chat\n`);
});

// ── Graceful shutdown ───────────────────────────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`\n[Server] ${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log('[Server] HTTP server closed. Exiting.');
    process.exit(0);
  });

  // Force exit after 10s if connections don't close
  setTimeout(() => {
    console.error('[Server] Forced exit after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejections — log and exit (Railway will restart)
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Promise Rejection:', reason);
  process.exit(1);
});

module.exports = app; // Export for testing
