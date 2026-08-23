# 🛍️ E-Commerce AI Customer Support Chatbot System

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Shopify API](https://img.shields.io/badge/Shopify-Admin%20REST%202024--01-95BF47.svg)](https://shopify.dev/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.1-orange.svg)](https://groq.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-4285F4.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

*A production-ready, resilient full-stack application — Node.js & Express backend plus a React frontend — for an intelligent e-commerce customer support chatbot built for online retail storefronts.*

## Table of Contents

- [Key Architecture Highlights](#-key-architecture-highlights)
- [Project Structure](#️-project-structure)
- [Quickstart Guide](#-quickstart-guide)
- [API Endpoints](#-key-rest-api-endpoints)
- [Security & Reliability](#️-security--reliability)
- [License](#-license)

---

## 🌟 Key Architecture Highlights

- **Zero External Vector DB Knowledge Base** — Parses policies, FAQs, and product catalog variants directly into structured memory at startup for sub-millisecond keyword and context retrieval.
- **Shopify Admin REST API Integration** — Live real-time order lookups, inventory status queries, and customer validation, with seamless offline CSV fallback logic.
- **Dual-LLM Resilient Fallback Pipeline**
  - **Primary:** Google Gemini 1.5 Flash — fast, cost-effective reasoning.
  - **Fallback:** Groq (`llama-3.1-8b-instant`) with automatic timeout-triggered failover.
- **Smart Escalation Matrix** — Real-time keyword scanning (refunds, damaged goods, chargebacks, human handoff) plus post-LLM sentiment analysis, with optional Discord and SMTP email notifications.
- **Cost & Token Analytics** — Per-session and per-model input/output token tracking, with real-time USD cost estimation returned directly in API responses.
- **Production Hardened** — Built-in rate limiting, Helmet security headers, CORS protection, structured logging, and multi-turn session memory with automatic TTL cleanup.

---

## 🏗️ Project Structure

```text
ecommerce-customer-support-automation/
├── docs/                                  # Ground truth knowledge base & catalog
│   ├── FAQ.txt                            # Store FAQs
│   ├── Shipping_Policy.txt                # Shipping rates & fulfillment timelines
│   ├── Returns_and_Exchange_Policy.txt    # Policy guidelines & exchange criteria
│   ├── product_catalog.csv                # Products & variants database
│   └── Customer_Orders.csv                # Offline reference customer orders
│
├── src/
│   ├── config/index.js                    # Centralized environment configuration
│   ├── routes/chat.routes.js              # REST API endpoint routes
│   ├── controllers/chat.controller.js     # Core chat orchestrator
│   ├── services/
│   │   ├── llm.service.js                 # Gemini ↔ Groq dual-LLM pipeline
│   │   ├── shopify.service.js             # Shopify REST API integration
│   │   ├── knowledgeBase.service.js       # In-memory document lookup & scoring
│   │   ├── orderLookup.service.js         # Order lookup (Shopify + CSV fallback)
│   │   └── session.service.js             # Multi-turn session manager with TTL
│   ├── utils/
│   │   ├── csvParser.js                   # BOM-safe CSV variant parser
│   │   ├── promptBuilder.js               # Dynamic system prompt composer
│   │   └── tokenTracker.js                # Token usage & USD cost estimator
│   └── middlewares/
│       ├── rateLimiter.js                 # 30 req/min sliding window rate limit
│       ├── requestLogger.js               # HTTP request logging
│       └── errorHandler.js                # Centralized error & 404 handler
│
├── components/                            # Frontend UI components
│   ├── Storefront.tsx                     # Product catalog showcase UI
│   └── ChatWidget.tsx                     # Floating AI support assistant interface
│
├── server.js                              # Server entry point & graceful shutdown
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
git clone https://github.com/ishmal-codes/E-commerce-customer-support-automation.git
cd E-commerce-customer-support-automation

# Install project dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file by copying `.env.example`:

```bash
cp .env.example .env
```

Then configure your environment variables inside `.env`:

```env
PORT=3000
NODE_ENV=development

# Shopify API Credentials (Optional / Fallback to CSV)
SHOPIFY_STORE_DOMAIN=your-demo-store.myshopify.com
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

### 4. Run the Application

```bash
# Start development server (with hot-reload)
npm run dev

# Start production server
npm start
```

---

## 📡 Key REST API Endpoints

### 1. Service Health Check

`GET /api/health`

**Sample Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-08-23T17:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "shopify": {
      "shopName": "demo-store"
    },
    "knowledgeBase": {
      "loaded": true,
      "faqEntries": 15,
      "products": 15,
      "shippingPolicy": true,
      "returnsPolicy": true
    },
    "sessions": {
      "active": 1
    }
  }
}
```

### 2. Chat with Support Assistant

`POST /api/chat`

**Request Body:**

```json
{
  "sessionId": "session-12345",
  "message": "Hi, what is the status of my order #10240?",
  "customerEmail": "customer@example.com"
}
```

**Response Body:**

```json
{
  "sessionId": "session-12345",
  "response": "Your order #10240 is currently in transit and scheduled for delivery within 2 business days.",
  "escalated": false,
  "sourcesUsed": ["csv_orders", "faq", "gemini"],
  "costMetrics": {
    "inputTokens": 618,
    "outputTokens": 98,
    "estimatedCostUSD": 0.00003874,
    "model": "gemini-1.5-flash"
  }
}
```

---

## 🛡️ Security & Reliability

- **Graceful Degradation** — If the Shopify API becomes unreachable, the assistant automatically falls back to offline order data snapshots (`Customer_Orders.csv`).
- **Failover Redundancy** — If Gemini times out (>8000ms) or hits rate limits, requests immediately fail over to Groq (`llama-3.1-8b`) without disruption.
- **Anti-Abuse Safeguards** — Built-in rate limiting restricts requests per IP (30 requests/minute by default).
- **Prompt Injection Defense** — Strict system prompt guardrails prevent policy hallucination and restrict unauthorized transactional operations (e.g. unauthorized direct cash refunds).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
