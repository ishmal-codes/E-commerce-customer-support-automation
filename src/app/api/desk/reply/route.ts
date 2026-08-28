import { appendMessage } from "@/lib/chat-store";
import { guardDeskRequest } from "@/lib/desk-auth";

export const dynamic = "force-dynamic";

/** POST /api/desk/reply — an agent's reply appears in the customer's widget. */
export async function POST(req: Request) {
  const denied = guardDeskRequest(req);
  if (denied) return denied;

  let body: { sessionId?: unknown; message?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "number" ? body.sessionId : NaN;
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }
  if (!message || message.length > 1500) {
    return Response.json({ error: "message is required." }, { status: 400 });
  }

  await appendMessage(sessionId, "agent", message);
  return Response.json({ ok: true });
}
