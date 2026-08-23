import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Structured data the widget can render as an order card. */
export type OrderCard = {
  orderNumber: string;
  status: "processing" | "in_transit" | "delivered";
  statusLabel: string;
  carrier?: string;
  tracking?: string;
  eta?: string;
  placedAt?: string;
  items: { name: string; qty: number }[];
  total: string;
};

/** Small state machine kept per conversation. */
export type SessionContext = {
  /** The bot asked for something and is waiting for the customer's reply. */
  awaiting?: "order_number" | null;
  /** Why we asked for the order number (changes the follow-up answer). */
  awaitingReason?: "status" | "return" | null;
  /** Consecutive unanswered/confused turns — the 2nd one escalates. */
  fallbackCount?: number;
};

/** Optional structured payload attached to a stored message. */
export type MessagePayload = {
  orderCard?: OrderCard;
};

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  context: jsonb("context").$type<SessionContext>().notNull().default({}),
  escalated: boolean("escalated").notNull().default(false),
  escalationRef: text("escalation_ref"),
  escalationReason: text("escalation_reason"),
  /** 'open' | 'resolved' | null */
  escalationStatus: text("escalation_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
});

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    /** 'user' | 'assistant' | 'agent' */
    role: text("role").notNull(),
    content: text("content").notNull(),
    payload: jsonb("payload").$type<MessagePayload>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("chat_messages_session_idx").on(table.sessionId)],
);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  /** 'processing' | 'in_transit' | 'delivered' */
  status: text("status").notNull(),
  statusLabel: text("status_label").notNull(),
  carrier: text("carrier"),
  tracking: text("tracking"),
  eta: text("eta"),
  placedAt: text("placed_at"),
  items: jsonb("items").$type<{ name: string; qty: number }[]>().notNull(),
  total: text("total").notNull(),
  customerEmail: text("customer_email").notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Order = typeof orders.$inferSelect;
