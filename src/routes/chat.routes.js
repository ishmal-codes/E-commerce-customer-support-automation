'use strict';

const { Router } = require('express');
const { handleChat, handleHealth } = require('../controllers/chat.controller');
const { chatRateLimiter } = require('../middlewares/rateLimiter');

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Health check — returns server, Shopify, and KB status
 * @access  Public
 */
router.get('/health', handleHealth);

/**
 * @route   POST /api/chat
 * @desc    Send a message to the AI support chatbot
 * @access  Public (rate-limited)
 *
 * @body    {string}  message        - The customer's message (required, max 2000 chars)
 * @body    {string}  [sessionId]    - Session UUID for conversation continuity (generated if omitted)
 * @body    {string}  [customerEmail]- Customer's email for order lookups
 *
 * @returns {object}  { sessionId, response, escalated, sourcesUsed, costMetrics }
 */
router.post('/chat', chatRateLimiter, handleChat);

module.exports = router;
