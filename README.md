# 🛍️ E-Commerce AI Customer Support Chatbot Backend

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.19-blue.svg)](https://expressjs.com/)
[![Shopify API](https://img.shields.io/badge/Shopify-Admin%20REST%202024--01-95BF47.svg)](https://shopify.dev/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.1%208B-orange.svg)](https://groq.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-4285F4.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready, resilient Node.js & Express backend for an intelligent E-commerce customer support chatbot tailored for Apple product retailers (Trevolk Apple Demo Store).

---

## 🌟 Key Architecture Highlights

- **Zero External Vector DB Knowledge Base**: Parses policies, FAQ, and Shopify catalog CSV variants directly into structured memory at startup for sub-millisecond keyword and context retrieval.
- **Shopify Admin REST API Integration**: Live real-time order lookups, inventory queries, and customer status validation with graceful offline CSV fallback.
- **Dual-LLM Resilient Fallback Pipeline**:
  - **Primary**: Google Gemini 1.5 Flash (high speed, cost-effective).
  - **Secondary / Fallback**: Groq (`llama-3.1-8b-instant`) with automatic timeout-triggered failover.
- **Smart Escalation Matrix**: Real-time keyword scanning (refunds, damaged goods, chargebacks, human handoff) + post-LLM sentiment checks with optional Discord and SMTP email notifications.
- **Cost & Token Analytics**: Per-session and per-model input/output token tracking with real-time USD cost estimation.
- **Production Hardened**: Rate-limiting, Helmet security headers, CORS, structured logging, and multi-turn session memory with TTL cleanup.

---

## 🏗️ Project Structure

```
customer-support-chatbot/
├── docs/                                    # Ground truth knowledge base & catalog
│   ├── Backend_Plan_Musa.md                 # Technical specification
│   ├── FAQ.txt                              # 15 store FAQs
│   ├── Shipping_Policy.txt                  # Shipping rates & fulfillment timelines
│   ├── Returns_and_Exchange_Policy.txt      # 14-day policy & condition criteria
│   ├── product_catalog.csv                  # 15 Apple products + variants
│   └── Customer_Orders.csv                  # 20 offline reference orders
│
├── src/
│   ├── config/index.js                      # Centralized environment configuration
│   ├── routes/chat.routes.js                # API endpoints
│   ├── controllers/chat.controller.js       # Core chat orchestrator
│   ├── services/
│   │   ├── llm.service.js                   # Gemini ↔ Groq dual-LLM pipeline
│   │   ├── shopify.service.js               # Shopify REST API integration
│   │   ├── knowledgeBase.service.js         # In-memory document lookup & scoring
│   │   ├── orderLookup.service.js           # Order lookup (Shopify + CSV fallback)
│   │   ├── escalation.service.js            # Keyword detection & notification dispatcher
│   │   └── session.service.js               # Multi-turn session manager with TTL
│   ├── utils/
│   │   ├── csvParser.js                     # BOM-safe Shopify CSV variant parser
│   │   ├── promptBuilder.js                 # Dynamic system prompt composer
│   │   └── tokenTracker.js                  # Token usage & USD cost estimator
│   └── middlewares/
│       ├── rateLimiter.js                   # 30 req/min sliding window rate limit
│       ├── requestLogger.js                 # Morgan HTTP request logging
│       └── errorHandler.js                  # Centralized error & 404 handler
│
├── server.js                                # Server entrypoint & graceful shutdown
├── package.json
├── .env.example
└── .gitignore
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/musa8868973-web/E-commerce-customer-support-chatbot.git
cd E-commerce-customer-support-chatbot

# Install dependencies
npm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your credentials in `.env`:

```env
PORT=3000
NODE_ENV=development

# Shopify Configuration
SHOPIFY_STORE_DOMAIN=trevolk-apple-demo.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_your_token_here
SHOPIFY_API_VERSION=2024-01

# LLM Providers
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
LLM_TIMEOUT_MS=8000

# Escalation Alerts (Optional)
DISCORD_WEBHOOK_ENABLED=false
DISCORD_WEBHOOK_URL=
EMAIL_ENABLED=false
```

### 4. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## 📡 API Endpoints

### 1. Health Check
`GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-17T07:29:13.827Z",
  "version": "1.0.0",
  "services": {
    "shopify": {
      "connected": true,
      "shopName": "trevolk-apple-demo"
    },
    "knowledgeBase": {
      "loaded": true,
      "faqEntries": 15,
      "products": 15,
      "shippingPolicy": true,
      "returnsPolicy": true
    },
    "sessions": {
      "active": 0
    }
  }
}
```

---

### 2. Chat with Support Assistant
`POST /api/chat`

**Request Body:**
```json
{
  "sessionId": "session-12345",
  "message": "Hi, what is the status of my order #10240?",
  "customerEmail": "omar@example.com"
}
```

**Response Body:**
```json
{
  "sessionId": "session-12345",
  "response": "Your order #10240 is currently delayed. The tracking number is 9400111899223857217058. You can track this shipment directly on the carrier's website.",
  "escalated": false,
  "sourcesUsed": ["csv_orders", "faq", "groq"],
  "costMetrics": {
    "inputTokens": 618,
    "outputTokens": 98,
    "estimatedCostUSD": 0.00003874,
    "model": "llama-3.1-8b-instant"
  }
}
```

---

## 🛡️ Security & Reliability

- **Graceful Degradation**: If Shopify API is unreachable, the chatbot automatically falls back to offline customer order snapshots.
- **Failover Redundancy**: If Gemini times out (>8s) or encounters rate limits, queries immediately transition to Groq without client disruption.
- **Anti-Abuse**: Rate limiter restricts incoming traffic per IP (30 requests/minute by default).
- **Prompt Injection Defense**: Guardrails in system prompt explicitly prevent policy fabrication and restrict unauthorized actions (e.g. issuing direct cash refunds).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
