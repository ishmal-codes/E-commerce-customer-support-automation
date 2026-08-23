'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * rateLimiter.js
 * Per-IP rate limiter for the /api/chat endpoint.
 * Uses in-memory store (suitable for single-instance Railway deployment).
 * For multi-instance deployments, swap the store for Redis.
 */

const chatRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,    // Disable X-RateLimit-* legacy headers
  message: {
    error: 'Too many requests. Please wait before sending another message.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  handler: (req, res, next, options) => {
    console.warn(`[RateLimit] IP ${req.ip} exceeded limit. Path: ${req.path}`);
    res.status(429).json(options.message);
  },
});

module.exports = { chatRateLimiter };
