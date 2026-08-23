import { count } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { SEED_ORDERS } from "@/lib/catalog";

let seedChecked = false;

/** Idempotent: inserts the demo orders the first time the API is hit. */
export async function ensureSeeded() {
  if (seedChecked) return;
  try {
    const [row] = await db.select({ n: count() }).from(orders);
    if ((row?.n ?? 0) === 0) {
      await db.insert(orders).values(
        SEED_ORDERS.map((o) => ({
          orderNumber: o.orderNumber,
          status: o.status,
          statusLabel: o.statusLabel,
          carrier: o.carrier,
          tracking: o.tracking,
          eta: o.eta,
          placedAt: o.placedAt,
          items: [...o.items],
          total: o.total,
          customerEmail: o.customerEmail,
        })),
      );
    }
  } catch {
    // Tables may not exist yet before `drizzle-kit push` — never crash the request.
  }
  seedChecked = true;
}
