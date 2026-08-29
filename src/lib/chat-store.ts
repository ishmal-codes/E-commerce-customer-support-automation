import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatSessions, type ChatSession } from "@/db/schema";
import type { TranscriptResponse } from "@/lib/types";

// In-memory fallback stores when database is unreachable
const memorySessions = new Map<string, ChatSession>();
const memoryMessages = new Map<
  number,
  Array<{
    id: number;
    sessionId: number;
    role: "user" | "assistant" | "agent";
    content: string;
    payload?: { orderCard?: import("@/db/schema").OrderCard } | null;
    createdAt: Date;
  }>
>();
let memMsgIdCounter = 1;
let memSessionIdCounter = 1;

/** Find the session by its browser token, or create it on first contact. */
export async function getOrCreateSession(token: string): Promise<ChatSession> {
  try {
    const existing = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.token, token))
      .limit(1);
    const found = existing[0];
    if (found) return found;

    try {
      const created = await db
        .insert(chatSessions)
        .values({ token })
        .returning();
      return created[0]!;
    } catch {
      const retry = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.token, token))
        .limit(1);
      if (retry[0]) return retry[0];
    }
  } catch {
    // Database offline / unreachable fallback to in-memory store
  }

  // Memory fallback
  if (memorySessions.has(token)) {
    return memorySessions.get(token)!;
  }

  const newSession: ChatSession = {
    id: memSessionIdCounter++,
    token,
    context: {},
    escalated: false,
    escalationRef: null,
    escalationReason: null,
    escalationStatus: "none",
    createdAt: new Date(),
    lastMessageAt: new Date(),
  };
  memorySessions.set(token, newSession);
  return newSession;
}

export async function appendMessage(
  sessionId: number,
  role: "user" | "assistant" | "agent",
  content: string,
  payload?: { orderCard?: import("@/db/schema").OrderCard },
) {
  try {
    await db.insert(chatMessages).values({
      sessionId,
      role,
      content,
      payload: payload ?? null,
    });
    await db
      .update(chatSessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  } catch {
    // Database offline / unreachable fallback
  }

  // Always keep in-memory backup
  if (!memoryMessages.has(sessionId)) {
    memoryMessages.set(sessionId, []);
  }
  memoryMessages.get(sessionId)!.push({
    id: memMsgIdCounter++,
    sessionId,
    role,
    content,
    payload: payload ?? null,
    createdAt: new Date(),
  });
}

/** Full transcript for a token — used to restore the widget and by /desk. */
export async function buildTranscript(token: string): Promise<TranscriptResponse> {
  try {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.token, token))
      .limit(1);

    if (session) {
      const rows = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, session.id))
        .orderBy(asc(chatMessages.id));

      return {
        sessionId: token,
        escalated: session.escalated && session.escalationStatus !== "resolved",
        escalationRef: session.escalationRef,
        messages: rows.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant" | "agent",
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          orderCard: m.payload?.orderCard ?? null,
        })),
      };
    }
  } catch {
    // Database offline fallback
  }

  const memSession = memorySessions.get(token);
  if (!memSession) {
    return { sessionId: token, escalated: false, escalationRef: null, messages: [] };
  }

  const memRows = memoryMessages.get(memSession.id) ?? [];
  return {
    sessionId: token,
    escalated: memSession.escalated && memSession.escalationStatus !== "resolved",
    escalationRef: memSession.escalationRef,
    messages: memRows.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      orderCard: m.payload?.orderCard ?? null,
    })),
  };
}
