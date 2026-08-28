import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { guardDeskRequest } from "@/lib/desk-auth";

export const dynamic = "force-dynamic";

/** POST /api/desk/resolve — mark an escalation as handled; the bot resumes. */
export async function POST(req: Request) {
  const denied = guardDeskRequest(req);
  if (denied) return denied;

  let body: { sessionId?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "number" ? body.sessionId : NaN;
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return Response.json({ error: "sessionId is required." }, { status: 400 });
  }

  try {
    await db
      .update(chatSessions)
      .set({ escalationStatus: "resolved" })
      .where(eq(chatSessions.id, sessionId));
  } catch {
    // Database offline fallback
  }

  return Response.json({ ok: true });
}
