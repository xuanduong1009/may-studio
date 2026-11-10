import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Limits per client IP. Stored in the database (not in memory) because on
 * Vercel every request may land on a different server instance.
 */
export const LIMITS = {
  order: { max: 8, windowSec: 600 },
  coupon: { max: 30, windowSec: 600 },
  orderLookup: { max: 30, windowSec: 600 },
  orderAction: { max: 10, windowSec: 600 },
  contact: { max: 5, windowSec: 3600 },
  review: { max: 10, windowSec: 3600 },
  search: { max: 120, windowSec: 60 },
} as const;

export type LimitName = keyof typeof LIMITS;

export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Counts one hit; returns false once the client is over the limit for the current window. */
export async function allow(name: LimitName, ip?: string): Promise<boolean> {
  const { max, windowSec } = LIMITS[name];
  const key = `${name}:${ip ?? (await clientIp())}`;
  const now = Date.now();
  const expired = now - windowSec * 1000;
  try {
    const row = await db.get<{ count: number }>(sql`
      insert into request_limits (key, count, window_start) values (${key}, 1, ${now})
      on conflict(key) do update set
        count = case when request_limits.window_start <= ${expired} then 1 else request_limits.count + 1 end,
        window_start = case when request_limits.window_start <= ${expired} then ${now} else request_limits.window_start end
      returning count`);
    // occasional cleanup so the table stays small
    if (Math.random() < 0.02) await db.run(sql`delete from request_limits where window_start < ${now - 86_400_000}`);
    return (row?.count ?? 0) <= max;
  } catch (e) {
    // never block real customers because the limiter itself failed
    console.error("[rate-limit]", e);
    return true;
  }
}
