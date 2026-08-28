/** Simple shared-secret gate for the /desk agent console.
 *  The secret lives in DESK_SECRET (env) and is sent via x-desk-secret header. */

const DESK_SECRET = process.env.DESK_SECRET || "trevolk2026";

/** Returns a 401 Response if the secret is missing/wrong, otherwise null (caller proceeds). */
export function guardDeskRequest(req: Request): Response | null {
  const provided = req.headers.get("x-desk-secret");
  if (provided !== DESK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
