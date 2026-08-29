import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { appendMessage, buildTranscript, getOrCreateSession } from "@/lib/chat-store";
import type { ChatResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * POST /api/chat — the agreed contract:
 *   request:  { message: string, sessionId: string }
 *   response: { response: string, escalated: boolean, ...optional extensions }
 */
export async function POST(req: NextRequest) {
  let body: { message?: unknown; sessionId?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";

  if (!message) {
    return Response.json({ error: "message is required." }, { status: 400 });
  }
  if (!sessionId) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }
  if (message.length > 1500) {
    return Response.json({ error: "Message too long." }, { status: 400 });
  }

  // 1. Ensure seed/session state
  await ensureSeeded();
  const session = await getOrCreateSession(sessionId);

  // Persist the customer's message
  await appendMessage(session.id, "user", message);

  // 2. Try calling Express backend server if running
  try {
    const controller = new AbortController();
    // The backend runs an agentic tool loop (LLM ↔ tools, up to 4 rounds)
    // which can legitimately take ~5–40s. A short timeout here would abort
    // valid answers. A dead backend still fails fast (connection refused).
    const timer = setTimeout(() => controller.abort(), 65_000);
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sessionId,
        // DB-backed handoff state so the backend bot steps aside once a
        // human has taken over the conversation.
        escalated: session.escalated && session.escalationStatus === "open",
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const responseText =
        data && typeof data.response === "string"
          ? data.response
          : data && data.text
            ? String(data.text)
            : "";

      if (responseText) {
        const escalated = Boolean(data.escalated);
        let handoffJustHappened = false;

        if (escalated && !session.escalated) {
          handoffJustHappened = true;
          session.escalated = true;
          session.escalationRef = `ESC-${1000 + session.id}`;
          session.escalationStatus = "open";
          // Persist the handoff so it is only announced ONCE. Without this the
          // DB row stays unescalated, every turn re-detects the transition and
          // the "Human handoff" banner repeats on every message.
          try {
            await db
              .update(chatSessions)
              .set({
                escalated: true,
                escalationRef: session.escalationRef,
                escalationReason: "Backend bot escalated the conversation",
                escalationStatus: "open",
              })
              .where(eq(chatSessions.id, session.id));
          } catch {
            // Database offline — in-memory state still covers this process.
          }
        }

        await appendMessage(session.id, "assistant", responseText);

        const backendChips =
          data && Array.isArray(data.quickReplies)
            ? data.quickReplies.filter((c: unknown): c is string => typeof c === "string" && c.trim().length > 0)
            : [];

        const payload: ChatResponse = {
          response: responseText,
          escalated,
          handoffJustHappened,
          escalationRef: session.escalationRef ?? null,
          quickReplies:
            backendChips.length > 0
              ? backendChips
              : [
                  "Track my order",
                  "Shipping times",
                  "Returns & refunds",
                  "Talk to a human",
                ],
          orderCard: null,
        };

        // Return immediately — do not run secondary fallback logic
        return Response.json(payload);
      }
    }
  } catch {
    // Backend offline / booting up — no local fallback engine; surface the fault
  }

  // 3. Backend unavailable — fail loudly so the outage is visible,
  //    instead of silently degrading to a second bot implementation.
  return Response.json(
    { error: "Support assistant is temporarily unavailable. Please try again in a moment." },
    { status: 503 },
  );
}

/** GET /api/chat?sessionId=… — restore the transcript (widget reopen + polling). */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId") ?? "";
  if (!sessionId) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }
  const transcript = await buildTranscript(sessionId);
  return Response.json(transcript);
}
