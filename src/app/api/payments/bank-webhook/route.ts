import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { extractOrderCode } from "@/lib/payments/vietqr";
import { logEvent, markOrderPaid } from "@/lib/server/orders";

/**
 * Bank transfer webhook (SePay format). SePay watches the shop's bank account
 * and POSTs every incoming transfer here; the order code in the transfer note
 * links it to an order, which is then marked paid automatically.
 * Configure SePay to send "Authorization: Apikey <SEPAY_WEBHOOK_KEY>".
 */
const payload = z.object({
  id: z.union([z.number(), z.string()]),
  transferType: z.string(),
  transferAmount: z.coerce.number(),
  content: z.string().optional().default(""),
  description: z.string().optional().default(""),
  referenceCode: z.string().nullish(),
});

function authorized(header: string | null) {
  const key = process.env.SEPAY_WEBHOOK_KEY;
  if (!key || !header) return false;
  const expected = Buffer.from(`Apikey ${key}`);
  const got = Buffer.from(header.trim());
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export async function POST(req: NextRequest) {
  if (!process.env.SEPAY_WEBHOOK_KEY) return NextResponse.json({ success: false, message: "disabled" }, { status: 503 });
  if (!authorized(req.headers.get("authorization"))) return NextResponse.json({ success: false }, { status: 401 });

  const parsed = payload.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "invalid payload" }, { status: 400 });
  const tx = parsed.data;
  if (tx.transferType !== "in") return NextResponse.json({ success: true, message: "ignored" });

  const code = extractOrderCode(`${tx.content} ${tx.description}`);
  const order = code ? await db.query.orders.findFirst({ where: eq(orders.code, code) }) : null;
  // always 200 for unmatched transfers, otherwise the sender keeps retrying
  if (!order) return NextResponse.json({ success: true, message: "no matching order" });

  const res = await markOrderPaid(order.id, {
    ref: tx.referenceCode ?? String(tx.id),
    actor: "bank-webhook",
    amount: tx.transferAmount,
    method: "VietQR",
  });
  if (!res.ok && res.error === "amount") {
    await logEvent(db, order.id, "payment", { status: "partial", message: `Received ${tx.transferAmount} < ${order.total}`, actor: "bank-webhook" });
  }
  return NextResponse.json({ success: true, matched: order.code, result: res.ok ? "paid" : res.error });
}
