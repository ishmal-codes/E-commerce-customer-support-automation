import type { NextRequest } from "next/server";
import { ensureSeeded } from "@/db/seed";
import { runAssistant } from "@/lib/assistant";
import { appendMessage, buildTranscript, getOrCreateSession, sleep } from "@/lib/chat-store";
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
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId }),
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
        }

        await appendMessage(session.id, "assistant", responseText);

        const payload: ChatResponse = {
          response: responseText,
          escalated,
          handoffJustHappened,
          escalationRef: session.escalationRef ?? null,
          quickReplies: [
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
    // Backend offline / booting up — fall back to local assistant engine below
  }

  // 3. Fallback to local assistant engine only when backend is unavailable
  const outcome = await runAssistant(session, message);
  const responseText = outcome.response;
  const escalated = session.escalated && session.escalationStatus !== "resolved";

  await appendMessage(session.id, "assistant", responseText, {
    orderCard: outcome.orderCard ?? undefined,
  });

  // Small natural delay so typing indicator reads smoothly
  await sleep(350 + Math.random() * 300);

  const payload: ChatResponse = {
    response: responseText,
    escalated,
    handoffJustHappened: outcome.handoffJustHappened,
    escalationRef: session.escalationRef ?? null,
    quickReplies: outcome.quickReplies,
    orderCard: outcome.orderCard,
  };
  return Response.json(payload);
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
