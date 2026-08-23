 # E-commerce Customer Support Automation — Frontend Plan

**Owner: Ishmal | Portfolio Project #1**

## Project context
This is a portfolio project we're building like a real client job — no shortcuts. Once done, it gets pitched to actual clients with a live demo link and case study, so the widget needs to look and feel like something we'd actually ship to a paying client, not a rough prototype.

**What you're building:** the customer-facing chat widget that sits on the demo Shopify store and lets a visitor ask about order status, shipping/returns, and product questions.

**Scope (v1):** website widget only — no WhatsApp integration (dropped from v1, too much approval overhead for this timeline).

---

## Phase 0 — Setup (Days 1–2)

### 0.1 Scaffold the widget shell
While Musa sets up the Shopify dev store and backend, you can start on the UI shell independently:
- Basic chat widget layout: floating launcher button, expandable chat window, message bubbles (user vs bot), input box + send button.
- No real logic yet — just the UI shell with dummy/mock messages to test layout and styling.
- Keep it embeddable — this needs to sit on top of a Shopify storefront like a real support widget (think Intercom/Tidio style), not take over the page.

---

## Phase 1 — While backend is being built (Days 3–6)
Backend won't be ready yet, so use this time to:
- Polish the widget UI/UX: typing indicators, message timestamps (optional), smooth open/close animation, mobile responsiveness (a lot of e-commerce traffic is mobile — this matters for the pitch).
- Handle UI states: loading/"bot is typing," error state (backend unreachable), escalation state (clearly show when a query has been handed off to a human — this is something we want to visibly demo to clients).
- Reference the frontend-design skill/guidance for polish — this widget is part of what sells the pitch, so it shouldn't look templated or default.

---

## Phase 2 — Integration with backend (Days 6–8)
Once Musa's backend endpoints are ready:
- Coordinate on the **API contract** — agree on the exact request/response shape before wiring, e.g.:
  - Request: `POST /chat` with `{ message: string, sessionId: string }`
  - Response: `{ response: string, escalated: boolean }`
- Wire the widget's send button to actually call the backend and render real responses.
- Handle the `escalated: true` case distinctly in the UI (e.g. a visible "connecting you to a human" message) — don't let it look identical to a normal bot answer.
- Test the full flow live: type a question in the widget → see a real answer come back from Shopify data + LLM.

---

## Phase 3 — Internal testing (Days 8–9)
Along with Musa and Rohail, actively try to break the experience:
- Fast/repeated messages (does the UI hold up?)
- Long bot responses (does the layout handle them cleanly?)
- Network/backend errors (does the widget fail gracefully, or just break?)
- General usability — would a real customer find this intuitive?

Flag any UX rough edges here so there's time to fix them before Phase 4.

---

## Phase 4 — Packaging for pitch (Days 9–10)
- Final visual polish pass — this is what clients see first, so it needs to look client-ready.
- Support the demo video recording (the widget is likely the main visual in that video).
- The widget goes live embedded on the deployed demo store — this becomes part of the **live sandbox link** prospects will click and interact with directly.

---

## Key principles to keep in mind
- This widget is a big part of the first impression during a client pitch — polish matters here more than in most portfolio pieces.
- No overclaiming in the UI copy either (e.g. don't word things like the bot "knows" something it's just retrieving — keep language accurate).
- Ping Rohail/Musa if you're blocked waiting on backend endpoints — build ahead on UI/UX polish in the meantime rather than sitting idle.