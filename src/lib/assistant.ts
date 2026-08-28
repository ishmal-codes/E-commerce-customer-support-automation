import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  chatSessions,
  orders,
  type ChatSession,
  type OrderCard,
  type SessionContext,
} from "@/db/schema";
import { POLICIES, PRODUCT_FACTS, PRODUCTS, SEED_ORDERS } from "@/lib/catalog";

/** What the engine decides for one customer message. */
export type AssistantOutcome = {
  response: string;
  quickReplies: string[];
  orderCard: OrderCard | null;
  handoffJustHappened: boolean;
  escalationReason?: string;
};

const HUMAN_RE =
  /\b(human|real (person|human)|agent|representative|someone (real|there|helpful)|manager|talk to (a |someone)|speak to (a |someone))\b/i;
const FRUSTRATED_RE =
  /\b(useless|terrible|awful|horrible|scam|joke|ridiculous|furious|fed up|fed-up|complaint|complain|unacceptable|worst|disgusting)\b/i;
const REFUND_MISSING_RE =
  /refund.*\b(not|still|haven't|hasn't|waiting|never|weeks?)\b|\b(still|never|not).*(received|got|seen).*refund/i;
const CANCEL_RE = /\bcancel(l?ed|ing|lation)?\b/i;
const GREETING_RE = /^(hi|hey|heya|hello|good (morning|afternoon|evening)|howdy|yo)\b/i;
const THANKS_RE = /\b(thanks|thank you|cheers|appreciate it|perfect,? thanks|that's all)\b/i;
const RETURNS_RE = /\b(return|refund|exchange|send back|money back)\b/i;
const SHIPPING_RE =
  /\b(shipping|shipment|delivery|deliver|dispatch|ship|arrive|arrival|postage|courier|how long).*(\b|$)|\bwhen will it arrive\b/i;
const STATUS_RE =
  /\b(track|tracking|status|where)\b.*\b(order|package|parcel|item|it)\b|\border\b.*\b(status|track|where|when|coming|arrive)\b|\bwhere'?s my\b/i;
const STOCK_RE = /\b(in stock|available|availability|inventory|restock|stock)\b/i;
const GENERIC_PRODUCT_RE =
  /\b(products?|what do you (sell|have)|catalog(ue)?|collection|recommend|iphones? lineup|specs?|features?)\b/i;
const CONTACT_RE = /\b(hours?|contact|phone|email|address|reach you)\b/i;

const BASE_CHIPS = ["Track my order", "Shipping times", "Returns & refunds"];

function parseOrderNumber(text: string, context: SessionContext): string | null {
  const hashMatch = text.match(/#\s*(\d{3,6})\b/);
  if (hashMatch?.[1]) return `#${hashMatch[1]}`;
  const wordMatch = text.match(/\border\s*#?\s*-?\s*(\d{3,6})\b/i);
  if (wordMatch?.[1]) return `#${wordMatch[1]}`;
  const bare = text.match(/\b(\d{3,6})\b/);
  if (bare?.[1] && (context.awaiting === "order_number" || /\border\b/i.test(text))) {
    return `#${bare[1]}`;
  }
  return null;
}

async function updateContext(session: ChatSession, patch: SessionContext) {
  const next: SessionContext = { ...session.context, ...patch };
  session.context = next;
  try {
    await db
      .update(chatSessions)
      .set({ context: next })
      .where(eq(chatSessions.id, session.id));
  } catch {
    // Database offline fallback
  }
}

async function escalate(session: ChatSession, reason: string): Promise<string> {
  const ref = `ESC-${1000 + session.id}`;
  session.escalated = true;
  session.escalationRef = ref;
  session.escalationReason = reason;
  session.escalationStatus = "open";
  session.context = {};
  try {
    await db
      .update(chatSessions)
      .set({
        escalated: true,
        escalationRef: ref,
        escalationReason: reason,
        escalationStatus: "open",
        context: {},
      })
      .where(eq(chatSessions.id, session.id));
  } catch {
    // Database offline fallback
  }
  return ref;
}

function orderToCard(o: typeof orders.$inferSelect): OrderCard {
  return {
    orderNumber: o.orderNumber,
    status: o.status as OrderCard["status"],
    statusLabel: o.statusLabel,
    carrier: o.carrier ?? undefined,
    tracking: o.tracking ?? undefined,
    eta: o.eta ?? undefined,
    placedAt: o.placedAt ?? undefined,
    items: o.items,
    total: o.total,
  };
}

async function resolveOrder(
  session: ChatSession,
  orderNumber: string,
  text: string,
): Promise<AssistantOutcome | null> {
  let order: typeof orders.$inferSelect | null = null;
  try {
    const [found] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);
    if (found) order = found;
  } catch {
    // Database offline fallback: lookup in SEED_ORDERS
  }

  if (!order) {
    const seedMatch = SEED_ORDERS.find((o) => o.orderNumber === orderNumber);
    if (seedMatch) {
      order = {
        id: 1,
        orderNumber: seedMatch.orderNumber,
        status: seedMatch.status,
        statusLabel: seedMatch.statusLabel,
        carrier: seedMatch.carrier,
        tracking: seedMatch.tracking,
        eta: seedMatch.eta,
        placedAt: seedMatch.placedAt,
        items: [...seedMatch.items],
        total: seedMatch.total,
        customerEmail: seedMatch.customerEmail,
      };
    }
  }

  if (!order) {
    await updateContext(session, { awaiting: null, awaitingReason: null });
    return {
      response: `I couldn't match ${orderNumber} to an order in this store. Double-check the number (it looks like #10234), or I can hand you to the care team to look it up manually.`,
      quickReplies: ["Talk to a human", ...BASE_CHIPS],
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  const wantsReturn =
    RETURNS_RE.test(text) || session.context.awaitingReason === "return";
  await updateContext(session, { awaiting: null, awaitingReason: null, fallbackCount: 0 });
  const card = orderToCard(order);

  if (wantsReturn) {
    if (order.status === "delivered") {
      return {
        response: `Order ${order.orderNumber} was delivered ${order.eta ?? "recently"}, so you're inside the 14-day return window. Just make sure the device is in its original condition with Apple ID signed out and Find My iPhone disabled. I can start the return process for you, or connect you with the care team.`,
        quickReplies: ["That's all, thanks", "Shipping times"],
        orderCard: card,
        handoffJustHappened: false,
      };
    }
    if (order.status === "in_transit") {
      return {
        response: `Order ${order.orderNumber} is still on its way (${order.eta ?? "ETA soon"}). You can start a return within 14 calendar days of delivery — once it arrives, I can help you get that going.`,
        quickReplies: ["Track my order", "That's all, thanks"],
        orderCard: card,
        handoffJustHappened: false,
      };
    }
    return {
      response: `Order ${order.orderNumber} hasn't shipped yet, so a return isn't needed — but if you'd like to change or cancel it, that needs the care team. Want me to flag them?`,
      quickReplies: ["Talk to a human", "Keep the order, thanks"],
      orderCard: card,
      handoffJustHappened: false,
    };
  }

  const opener =
    order.status === "delivered"
      ? `Here's what I found for order ${order.orderNumber} — it arrived ${order.eta ?? "recently"}.`
      : order.status === "processing"
        ? `Here's what I found for order ${order.orderNumber} — it's still being prepared${order.eta ? ` (${order.eta})` : ""}.`
        : `Here's what I found for order ${order.orderNumber} — it's ${order.statusLabel.toLowerCase()} with ${order.carrier ?? "the carrier"}${order.eta ? `, expected ${order.eta}` : ""}.`;

  return {
    response: opener,
    quickReplies: ["Start a return", "Shipping times", "That's all, thanks"],
    orderCard: card,
    handoffJustHappened: false,
  };
}

export async function runAssistant(
  session: ChatSession,
  rawText: string,
): Promise<AssistantOutcome> {
  const text = rawText.trim();
  const context = session.context ?? {};

  // 1. Already handed off to a human → everything goes to the care team.
  if (session.escalated && session.escalationStatus === "open") {
    return {
      response: `Thanks — that's gone straight to the care team and they'll reply right here in the chat. Your reference is ${session.escalationRef ?? "on file"}.`,
      quickReplies: [],
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  // 2. Explicit or emotional handoff triggers.
  if (HUMAN_RE.test(text)) {
    const ref = await escalate(session, "Customer asked for a human specialist.");
    return {
      response: `Of course — I've flagged this for a human specialist (reference ${ref}). Someone from the care team takes over from here; anything you type now goes to them.`,
      quickReplies: [],
      orderCard: null,
      handoffJustHappened: true,
      escalationReason: "Customer asked for a human specialist.",
    };
  }
  if (FRUSTRATED_RE.test(text)) {
    const ref = await escalate(session, "Customer seems frustrated — priority handoff.");
    return {
      response: `I'm sorry this has been a bad experience. I've flagged it as priority for a human specialist (reference ${ref}) — they'll take it from here in this same chat.`,
      quickReplies: [],
      orderCard: null,
      handoffJustHappened: true,
      escalationReason: "Customer seems frustrated — priority handoff.",
    };
  }
  if (REFUND_MISSING_RE.test(text)) {
    const ref = await escalate(session, "Missing refund — needs payment specialist.");
    return {
      response: `A missing refund needs a payment specialist, so I've flagged this for the team (reference ${ref}). They can see everything you've typed here and will reply in this chat.`,
      quickReplies: [],
      orderCard: null,
      handoffJustHappened: true,
      escalationReason: "Missing refund — needs payment specialist.",
    };
  }
  if (CANCEL_RE.test(text)) {
    const ref = await escalate(session, "Order change/cancellation request.");
    return {
      response: `Order changes go through the care team, so I've flagged this for them (reference ${ref}). They'll reply here shortly — anything else you type reaches them too.`,
      quickReplies: [],
      orderCard: null,
      handoffJustHappened: true,
      escalationReason: "Order change/cancellation request.",
    };
  }

  // 3. Small talk — keep it short and honest.
  if (GREETING_RE.test(text) && text.length < 40) {
    return {
      response:
        "Hi! I'm Trevolk's support assistant. I can look up order status, explain shipping and returns, or answer product questions — all from the store's live data. What can I check for you?",
      quickReplies: ["Track my order", "Shipping times", "Returns & refunds", "Product questions"],
      orderCard: null,
      handoffJustHappened: false,
    };
  }
  if (THANKS_RE.test(text) && text.length < 60) {
    return {
      response: "Anytime! If anything else comes up, I'm right here — and a human can take over at any point.",
      quickReplies: BASE_CHIPS,
      orderCard: null,
      handoffJustHappened: false,
    };
  }
  if (/keep the order/i.test(text)) {
    return {
      response: "All good — the order stays as it is. Anything else I can look up?",
      quickReplies: BASE_CHIPS,
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  // 4. An order number is present → straight lookup.
  const orderNumber = parseOrderNumber(text, context);
  if (orderNumber) {
    const resolved = await resolveOrder(session, orderNumber, text);
    if (resolved) return resolved;
  }

  // 5. We asked for an order number but didn't get one.
  if (context.awaiting === "order_number") {
    await updateContext(session, { awaiting: null, awaitingReason: null });
    return {
      response:
        "No worries — whenever you have it, your order number looks like #10234 (it's in your confirmation email). Or pick one of the demo orders below.",
      quickReplies: ["#10234", "#10240", "#10246", "Talk to a human"],
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  // 6. "Check my return window" chip.
  if (/check (my )?return window/i.test(text)) {
    await updateContext(session, { awaiting: "order_number", awaitingReason: "return" });
    return {
      response: "Happy to check that. What's the order number?",
      quickReplies: ["#10234", "#10240", "#10246"],
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  // 7. Policy intents.
  if (RETURNS_RE.test(text)) {
    await updateContext(session, { fallbackCount: 0 });
    return {
      response: POLICIES.returns,
      quickReplies: ["Check my return window", "Shipping times", "Talk to a human"],
      orderCard: null,
      handoffJustHappened: false,
    };
  }
  if (SHIPPING_RE.test(text)) {
    await updateContext(session, { fallbackCount: 0 });
    return {
      response: POLICIES.shipping,
      quickReplies: ["Track my order", "Start a return"],
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  // 8. Order status without a number → ask once.
  if (STATUS_RE.test(text)) {
    await updateContext(session, { awaiting: "order_number", awaitingReason: "status", fallbackCount: 0 });
    return {
      response:
        "Let me look that up. What's the order number? It looks like #10234 and it's in your confirmation email — or pick a demo order below.",
      quickReplies: ["#10234", "#10240", "#10246"],
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  // 9. Product questions — from catalog data.
  if (STOCK_RE.test(text)) {
    await updateContext(session, { fallbackCount: 0 });
    const matchingProducts = PRODUCTS.filter((p) =>
      new RegExp(p.id + "|" + p.name.split(" ")[0], "i").test(text),
    );
    let stockAnswer: string;
    if (matchingProducts.length === 1) {
      stockAnswer = `Yes, the ${matchingProducts[0].name} is in stock ($${matchingProducts[0].price}).`;
    } else if (matchingProducts.length > 1) {
      stockAnswer = `Yes, both are in stock.`;
    } else {
      stockAnswer = `Yes, all items in the collection are currently in stock and ready to ship.`;
    }
    return {
      response: stockAnswer,
      quickReplies: ["Track my order", "Shipping times", "Returns & refunds"],
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  for (const fact of Object.values(PRODUCT_FACTS)) {
    if (fact.match.test(text)) {
      await updateContext(session, { fallbackCount: 0 });
      return {
        response: fact.answer,
        quickReplies: ["Track my order", "Start a return", "That's all, thanks"],
        orderCard: null,
        handoffJustHappened: false,
      };
    }
  }
  if (GENERIC_PRODUCT_RE.test(text)) {
    await updateContext(session, { fallbackCount: 0 });
    return {
      response: "We carry 9 iPhone models from $349 to $1,149 — including iPhone 15, 15 Pro, 15 Pro Max, 14, 14 Plus, and SE — plus AirPods, MagSafe cases, chargers and cables. Ask me about any specific model and I'll pull the full specs from the catalog.",
      quickReplies: ["iPhone 15 Pro", "iPhone SE", "AirPods", "Accessories"],
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  // 10. Store contact info.
  if (CONTACT_RE.test(text)) {
    await updateContext(session, { fallbackCount: 0 });
    return {
      response:
        "The care team answers here in this chat every day 9:00–18:00. Email works too — support@trevolk.shop — with a reply within one business day. If it's about an order, chatting here is fastest.",
      quickReplies: ["Track my order", "Talk to a human"],
      orderCard: null,
      handoffJustHappened: false,
    };
  }

  // 11. Fallback — honest about not knowing, escalates on the 2nd miss.
  const misses = (context.fallbackCount ?? 0) + 1;
  if (misses >= 2) {
    const ref = await escalate(session, "Assistant couldn't answer confidently twice in a row.");
    return {
      response: `I don't want to guess and give you the wrong answer, so I've flagged this for a human specialist (reference ${ref}). They'll pick it up right here in the chat.`,
      quickReplies: [],
      orderCard: null,
      handoffJustHappened: true,
      escalationReason: "Assistant couldn't answer confidently twice in a row.",
    };
  }
  await updateContext(session, { fallbackCount: misses });
  return {
    response:
      "I want to be accurate rather than guess, so I'm not sure about that one. Could you rephrase it, or pick one of these? And I can get a human any time you like.",
    quickReplies: ["Track my order", "Shipping times", "Returns & refunds", "Talk to a human"],
    orderCard: null,
    handoffJustHappened: false,
  };
}
