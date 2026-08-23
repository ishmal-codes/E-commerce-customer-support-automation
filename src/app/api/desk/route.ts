import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import type { DeskResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/desk — the agent console's live queue + transcripts. */
export async function GET() {
  try {
    const sessions = await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.lastMessageAt))
      .limit(50);

    const messages = await db.select().from(chatMessages).orderBy(asc(chatMessages.id));

    const bySession = new Map<number, DeskResponse["sessions"][number]["messages"]>();
    for (const m of messages) {
      const list = bySession.get(m.sessionId) ?? [];
      list.push({
        id: m.id,
        role: m.role as "user" | "assistant" | "agent",
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        orderCard: m.payload?.orderCard ?? null,
      });
      bySession.set(m.sessionId, list);
    }

    const response: DeskResponse = {
      sessions: sessions.map((s) => ({
        sessionId: s.id,
        token: s.token,
        escalated: s.escalated,
        escalationRef: s.escalationRef,
        escalationReason: s.escalationReason,
        escalationStatus: s.escalationStatus,
        createdAt: s.createdAt.toISOString(),
        lastMessageAt: s.lastMessageAt.toISOString(),
        messages: bySession.get(s.id) ?? [],
      })),
      stats: {
        totalConversations: sessions.length,
        openEscalations: sessions.filter(
          (s) => s.escalated && s.escalationStatus === "open",
        ).length,
        resolved: sessions.filter(
          (s) => s.escalated && s.escalationStatus === "resolved",
        ).length,
      },
    };

    return Response.json(response);
  } catch {
    return Response.json({
      sessions: [],
      stats: { totalConversations: 0, openEscalations: 0, resolved: 0 },
    });
  }
}
