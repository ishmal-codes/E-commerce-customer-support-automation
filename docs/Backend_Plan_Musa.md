# E-commerce Customer Support Automation — Backend Plan
**Owner: Musa | Stack: Node.js + Express | Portfolio Project #1**

## Project context
This is a portfolio project we're building like a real client job — no shortcuts, no placeholder logic. Once done, it gets pitched to actual clients (live demo link + case study), so treat data, structure, and edge cases as if a paying client's store depended on it.

**Scope (v1):**
- Order status lookup
- Shipping/return policy Q&A
- Product FAQs / pre-sale questions
- Human escalation when the bot can't/shouldn't answer (e.g. refunds, payments — explicitly out of scope for v1)
- No WhatsApp integration in v1 (dropped due to Meta API approval time) — website widget only

---

## Phase 0 — Setup (Days 1–2)

### 0.1 Environment setup
1. Init Node/Express project, set up repo structure.
2. Set up hosting on **Railway**.
3. Store secrets (Shopify token, Gemini/Groq API keys) in environment variables — never hardcoded.

### 0.2 Store Setup
#### here's what you're receiving from Rohail
1. store .myshopify.com URL: https://admin.shopify.com/store/trevolk-apple-demo
2. Admin API token
3. Plus plan was selected while creating store.

### 0.3 Bogus Gateway test orders exist
Rohail has already created some real checkout test orders, both the CSV and a handful of native Shopify orders exist, so you can reconcile/use both.

### 0.4 Scopes Rohail enabled on the API token
read_products, read_orders, and read_customers.

---

## Phase 1 — Core backend build (Days 3–6)

### 1.1 Knowledge base (structured, not vector DB)
Since v1 is FAQ/policy Q&A at small scale, skip vector DB — plain structured lookup (JSON/DB table keyed by topic) is enough. Only revisit vector search if content volume grows significantly later.

- Parse your 3 policy docs + FAQ into structured entries the bot can reference directly or inject into LLM context.

### 1.2 Shopify API integration
- **Order status endpoint**: given order ID (or customer email), query Shopify Admin API, return status + tracking info in a clean format.
- **Product/FAQ lookup**: pull product data (price, availability, variants) for pre-sale questions.

### 1.3 LLM integration
- **Gemini as primary**, **Groq as fallback** (matches our existing content pipeline pattern — reuse learnings from that).
- Build the prompt/context assembly: user question + relevant knowledge base entry + relevant Shopify data → LLM → response.

### 1.4 Escalation logic
- Detect out-of-scope requests (refunds, payment issues, anything the bot shouldn't handle) or low-confidence answers.
- On escalation: flag it clearly to the user ("let me get a human to help with that") + notify founders (email or Discord ping is fine for the demo).
- This is important for the pitch — it shows clients the bot knows its limits instead of hallucinating.

---

## Phase 2 — Integration with frontend (Days 6–8)
- Coordinate with Ishmal on the API contract: define request/response format for the widget (e.g. `POST /chat` with `{ message, sessionId }` → `{ response, escalated: bool }`).
- Expose clean, documented endpoints so Ishmal isn't guessing at your API shape.
- Test end-to-end once the widget is wired in: widget → your backend → Shopify/knowledge base → LLM → response back to widget.

---

## Phase 3 — Internal testing (Days 8–9)
Both you and the team should actively try to break it:
- Wrong/invalid order numbers
- Ambiguous questions
- Out-of-scope asks (refunds, payment issues) — confirm it escalates instead of guessing
- Track your **API cost-per-conversation** during this phase — we need this number before deciding pricing later.

Fix knowledge base gaps and prompt issues as you find them.

---

## Phase 4 — Packaging for pitch (Days 9–10)
- Deploy final version live on Railway — this becomes the **live sandbox link** clients can click and try themselves.
- Support the demo video recording and case study (tech stack section is on you to summarize accurately).

---

## Key principles to keep in mind
- Build this as the **reusable template** — future client customization should mean swapping in their data/policies, not rebuilding logic.
- No overclaiming: if escalation triggers, it should say so plainly, not pretend to know.
- Ping Rohail/Ishmal if you hit a blocker rather than sitting on it — this is a tight 10-day build with 3 more portfolio projects behind it.
