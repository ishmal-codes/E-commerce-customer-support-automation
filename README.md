# 🛍️ E-Commerce AI Customer Support Chatbot System

[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express-5.x-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle%20ORM-336791.svg)](https://orm.drizzle.team/)
[![Shopify API](https://img.shields.io/badge/Shopify-Admin%20REST%202024--01-95BF47.svg)](https://shopify.dev/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.1-orange.svg)](https://groq.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-4285F4.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

*A production-ready, resilient full-stack application — Next.js 16 frontend with an Express 5 backend — for an intelligent e-commerce customer support chatbot built for online retail storefronts.*

## Table of Contents

- [Key Architecture Highlights](#-key-architecture-highlights)
- [Dual Architecture Overview](#-dual-architecture-overview)
- [Project Structure](#️-project-structure)
- [Quickstart Guide](#-quickstart-guide)
- [Agent Desk Console](#-agent-desk-console)
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
- **Smart Escalation Matrix** — Real-time keyword scanning (refunds, damaged goods, chargebacks, human handoff) plus post-LLM sentiment analysis, with non-blocking Discord and SMTP email notifications.
- **Agent Desk Console** — Password-protected live agent dashboard at `/desk` for viewing conversations, replying to escalated customers, and resolving handoffs in real time.
- **PostgreSQL Persistence** — All conversations and messages persisted via Drizzle ORM for session continuity, audit trail, and agent desk transcript replay.
- **Cost & Token Analytics** — Per-session and per-model input/output token tracking, with real-time USD cost estimation returned directly in API responses.
- **Production Hardened** — Built-in rate limiting, Helmet security headers, CORS protection, structured logging, and multi-turn session memory with automatic TTL cleanup.

---

## 🔄 Dual Architecture Overview

The project runs **two independent systems** that serve the same chat widget:

| Layer | Technology | Port | Role |
|-------|-----------|------|------|
| **Express Backend** | Express 5 + Node.js | 3001 | Full LLM pipeline, Shopify integration, escalation, PostgreSQL persistence |
| **Next.js Frontend** | Next.js 16 + React 19 | 3000 | Storefront UI, chat widget, API routes, frontend fallback engine |

**How they work together:**
1. The chat widget calls `POST /api/chat` (Next.js API route).
2. The Next.js route forwards the request to the Express backend with a **3-second timeout**.
3. If the Express backend responds in time → the full LLM pipeline answer is shown.
4. If the backend is unreachable or times out → the **frontend fallback engine** (`assistant.ts`) handles the request using regex-based intent matching against the in-memory catalog, policies, and seed orders.

This means the demo works **even without the Express backend running** — critical for live pitch scenarios where network or hosting issues could occur.

---

## 🏗️ Project Structure

```text
ecommerce-customer-support-automation/
├── docs/                                  # Ground truth knowledge base & catalog
│   ├── FAQ.txt                            # Store FAQs (15 entries)
│   ├── Shipping_Policy.txt                # Shipping rates & fulfillment timelines
│   ├── Returns_and_Exchange_Policy.txt    # Return policy & exchange criteria
│   ├── product_catalog.csv                # 15 Apple products & 78 variants
│   ├── Customer_Orders.csv                # 20 customer orders (offline reference)
│   ├── Backend_Plan_Musa.md               # Backend implementation plan
│   └── Frontend_Plan_Ishmal.md            # Frontend implementation plan
│
├── src/
│   ├── app/                               # Next.js App Router (React 19)
│   │   ├── api/
│   │   │   ├── chat/route.ts              # Chat endpoint (proxies to Express or falls back)
│   │   │   ├── desk/
│   │   │   │   ├── route.ts               # GET — agent console queue + transcripts
│   │   │   │   ├── reply/route.ts         # POST — agent reply to customer
│   │   │   │   └── resolve/route.ts       # POST — resolve an escalation
│   │   │   └── health/route.ts            # GET — service health check
│   │   ├── desk/page.tsx                  # Agent console UI (password-protected)
│   │   ├── page.tsx                       # Storefront homepage
│   │   ├── layout.tsx                     # Root layout with fonts & metadata
│   │   └── globals.css                    # Tailwind CSS + custom animations
│   │
│   ├── components/
│   │   ├── Storefront.tsx                 # Product catalog showcase UI
│   │   └── ChatWidget.tsx                 # Floating AI support chat widget
│   │
│   ├── lib/
│   │   ├── assistant.ts                   # Frontend fallback chatbot engine
│   │   ├── catalog.ts                     # Products, policies, FAQ facts, seed orders
│   │   ├── chat-store.ts                  # PostgreSQL message persistence helpers
│   │   ├── desk-auth.ts                   # Shared-secret auth guard for /desk
│   │   └── types.ts                       # Shared API type contracts
│   │
│   ├── db/
│   │   ├── index.ts                       # Drizzle ORM + PostgreSQL connection
│   │   ├── schema.ts                      # DB schema (sessions, messages tables)
│   │   └── seed.ts                        # Database seed script
│   │
│   ├── config/index.js                    # Centralized environment configuration
│   ├── routes/chat.routes.js              # Express REST API routes
│   ├── controllers/chat.controller.js     # Core chat orchestrator
│   ├── services/
│   │   ├── llm.service.js                 # Gemini ↔ Groq dual-LLM pipeline
│   │   ├── shopify.service.js             # Shopify REST API integration
│   │   ├── knowledgeBase.service.js       # In-memory document lookup & scoring
│   │   ├── orderLookup.service.js         # Order lookup (Shopify + CSV fallback)
│   │   ├── escalation.service.js          # Discord + SMTP escalation notifications
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
├── server.js                              # Express server entry point
├── drizzle.config.json                    # Drizzle Kit configuration
├── next.config.ts                         # Next.js configuration
├── package.json
├── .env.example
└── .gitignore
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14+ (for conversation persistence)

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
# Server
PORT=3000
BACKEND_PORT=3001
BACKEND_URL=http://localhost:3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_support

# Store Identity (centralized — used in prompts, escalation, and health checks)
STORE_NAME=Trevolk Apple Store
STORE_SHORT_NAME=Trevolk
STORE_SUPPORT_EMAIL=support@trevolk.shop

# Agent Desk Console
DESK_SECRET=trevolk2026

# Shopify API (optional — falls back to CSV data)
SHOPIFY_STORE_DOMAIN=trevolk-apple-demo.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_your_token_here
SHOPIFY_API_VERSION=2024-01

# LLM Providers
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
LLM_TIMEOUT_MS=8000

# Escalation Alerts (optional)
DISCORD_WEBHOOK_ENABLED=false
DISCORD_WEBHOOK_URL=
EMAIL_ENABLED=false
```

### 4. Database Setup

```bash
# Push the schema to PostgreSQL
npx drizzle-kit push

# (Optional) Seed sample data
npx tsx src/db/seed.ts
```

### 5. Run the Application

```bash
# Terminal 1 — Start the Next.js frontend
npm run dev

# Terminal 2 — Start the Express backend (optional; frontend has fallback)
npm run server
```

The storefront opens at **http://localhost:3000** and the agent desk at **http://localhost:3000/desk**.

---

## 🖥️ Agent Desk Console

The password-protected agent console at `/desk` provides real-time human handoff capabilities:

- **Live conversation queue** — See all active conversations with smart polling (3s active, 10s idle, paused when tab hidden).
- **Full transcript replay** — View complete message history for any conversation.
- **Agent replies** — Send messages directly to the customer's chat widget as "Maya · Care Team."
- **Resolve escalations** — Mark handoffs as resolved so the bot resumes handling new messages.
- **KPI dashboard** — Total conversations, open escalations, and resolved count.

**Access:** Visit `/desk` and enter the `DESK_SECRET` password. The session persists in localStorage until you click "Lock."

---

## 📡 Key REST API Endpoints

### 1. Service Health Check

`GET /api/health`

```json
{
  "status": "ok",
  "timestamp": "2026-08-23T17:30:00.000Z",
  "service": "Trevolk Apple Store — Customer Support Chatbot API",
  "services": {
    "shopify": { "shopName": "demo-store" },
    "knowledgeBase": { "loaded": true, "faqEntries": 15, "products": 15 },
    "sessions": { "active": 1 }
  }
}
```

### 2. Chat with Support Assistant

`POST /api/chat`

**Request:**

```json
{
  "sessionId": "session-12345",
  "message": "What is the status of my order #10240?"
}
```

**Response:**

```json
{
  "response": "Your order #10240 is currently in transit...",
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

### 3. Agent Desk Endpoints

All desk endpoints require the `x-desk-secret` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/desk` | Live queue with all conversations and transcripts |
| `POST` | `/api/desk/reply` | Send an agent reply to a customer |
| `POST` | `/api/desk/resolve` | Mark an escalation as resolved |

---

## 🛡️ Security & Reliability

- **Agent Console Protection** — The `/desk` console and its API endpoints require a shared secret (`DESK_SECRET`), preventing unauthorized access to conversations and agent actions.
- **Smart Polling** — Both the chat widget and desk console use visibility-aware polling: 3–4s when active, 10s when idle, and paused entirely when the browser tab is hidden — reducing unnecessary HTTP requests by ~70%.
- **Graceful Degradation** — If the Shopify API or Express backend becomes unreachable, the chat widget automatically falls back to the in-memory frontend engine with offline order data.
- **Failover Redundancy** — If Gemini times out (>8000ms) or hits rate limits, requests immediately fail over to Groq (`llama-3.1-8b`) without disruption.
- **Anti-Abuse Safeguards** — Built-in rate limiting restricts requests per IP (30 requests/minute by default).
- **Prompt Injection Defense** — Strict system prompt guardrails prevent policy hallucination and restrict unauthorized transactional operations.
- **Centralized Configuration** — Store identity (name, email) is defined once in `config/index.js` and referenced everywhere via `config.store.*`, making rebranding a single-file change.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
