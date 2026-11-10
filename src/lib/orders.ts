import "server-only";
import { randomInt } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/lib/db";
import {
  coupons,
  orderEvents,
  orderItems,
  orders,
  products,
  productVariants,
  STATUS_FLOW,
  type Order,
  type OrderStatus,
} from "@/lib/db/schema";
import { orderStatusEmail, paymentReceivedEmail, sendEmail } from "@/lib/email";
import { evaluateCoupon, normalizeCoupon } from "@/lib/pricing";

export { canAccessOrder } from "@/lib/order-access";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Tx;

/** Runs work after the response is sent (emails must never slow down or break a checkout). */
export function afterResponse(task: () => Promise<unknown>) {
  try {
    after(task);
  } catch {
    // outside a request (scripts): run now
    void task();
  }
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid typos

export function generateOrderCode() {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `MAY-${s}`;
}

export async function logEvent(
  ex: Executor,
  orderId: number,
  type: (typeof orderEvents.$inferInsert)["type"],
  opts: { status?: string | null; message?: string | null; actor?: string } = {},
) {
  await ex.insert(orderEvents).values({ orderId, type, status: opts.status ?? null, message: opts.message ?? null, actor: opts.actor ?? "system" });
}

/** Puts the items of an order back into stock (used when it is cancelled). */
async function restock(ex: Executor, orderId: number) {
  const items = await ex.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const it of items) {
    if (!it.productId) continue;
    await ex
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} + ${it.quantity}` })
      .where(
        and(
          eq(productVariants.productId, it.productId),
          sql`lower(${productVariants.colorHex}) = ${it.colorHex.toLowerCase()}`,
          eq(productVariants.size, it.size),
        ),
      );
    await ex
      .update(products)
      .set({ stock: sql`${products.stock} + ${it.quantity}`, sold: sql`max(0, ${products.sold} - ${it.quantity})` })
      .where(eq(products.id, it.productId));
  }
}

export type StatusChange = { ok: true; order: Order } | { ok: false; error: "notFound" | "transition" };

/**
 * Moves an order to a new status, following STATUS_FLOW. Cancelling restocks
 * the items and releases the coupon; delivering a COD order marks it paid.
 * The update is conditional on the old status, so two admins clicking at the
 * same time cannot apply the change twice.
 */
export async function changeOrderStatus(orderId: number, next: OrderStatus, actor: string, note?: string): Promise<StatusChange> {
  const result = await db.transaction(async (tx): Promise<StatusChange> => {
    const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return { ok: false, error: "notFound" };
    if (!STATUS_FLOW[order.status].includes(next)) return { ok: false, error: "transition" };

    const patch: Partial<typeof orders.$inferInsert> = { status: next };
    if (next === "delivered" && order.paymentMethod === "cod" && order.paymentStatus === "unpaid") {
      patch.paymentStatus = "paid";
      patch.paidAt = new Date();
    }
    if (next === "cancelled" && order.paymentStatus === "paid") patch.paymentStatus = "refunded";

    const [updated] = await tx
      .update(orders)
      .set(patch)
      .where(and(eq(orders.id, orderId), eq(orders.status, order.status)))
      .returning();
    if (!updated) return { ok: false, error: "transition" };

    if (next === "cancelled") {
      await restock(tx, orderId);
      if (order.couponCode) {
        await tx
          .update(coupons)
          .set({ usedCount: sql`max(0, ${coupons.usedCount} - 1)` })
          .where(eq(coupons.code, order.couponCode));
      }
    }
    await logEvent(tx, orderId, "status", { status: next, message: note, actor });
    if (patch.paymentStatus === "paid") await logEvent(tx, orderId, "payment", { status: "paid", message: "COD", actor });
    if (patch.paymentStatus === "refunded") await logEvent(tx, orderId, "payment", { status: "refunded", actor });
    return { ok: true, order: updated };
  });

  if (result.ok) afterResponse(() => sendEmail(orderStatusEmail(result.order)));
  return result;
}

export type PaymentResult =
  | { ok: true; already: boolean }
  | { ok: false; error: "notFound" | "cancelled" | "amount" };

/**
 * Marks an order as paid. Idempotent: bank webhooks and payment gateways may
 * call it several times for the same transaction. A pending order is
 * confirmed automatically once paid.
 */
export async function markOrderPaid(
  orderId: number,
  opts: { ref?: string | null; actor: string; amount?: number; method?: string },
): Promise<PaymentResult> {
  const result = await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return { ok: false as const, error: "notFound" as const };
    if (order.paymentStatus === "paid") return { ok: true as const, already: true };
    if (order.status === "cancelled") return { ok: false as const, error: "cancelled" as const };
    if (opts.amount !== undefined && opts.amount < order.total) return { ok: false as const, error: "amount" as const };

    const nextStatus: OrderStatus = order.status === "pending" ? "confirmed" : order.status;
    const [updated] = await tx
      .update(orders)
      .set({ paymentStatus: "paid", paidAt: new Date(), paymentRef: opts.ref ?? null, status: nextStatus })
      .where(and(eq(orders.id, orderId), eq(orders.paymentStatus, "unpaid")))
      .returning();
    if (!updated) return { ok: true as const, already: true };

    await logEvent(tx, orderId, "payment", { status: "paid", message: [opts.method, opts.ref].filter(Boolean).join(" · ") || null, actor: opts.actor });
    if (nextStatus !== order.status) await logEvent(tx, orderId, "status", { status: nextStatus, actor: "system" });
    return { ok: true as const, already: false, order: updated };
  });

  if (result.ok && !result.already && "order" in result && result.order) {
    const order = result.order;
    afterResponse(() => sendEmail(paymentReceivedEmail(order)));
  }
  return result.ok ? { ok: true, already: result.already } : result;
}

/** Loads a coupon and checks it against the cart. */
export async function checkCoupon(code: string | null | undefined, subtotal: number) {
  const key = normalizeCoupon(code);
  if (!key) return evaluateCoupon(null, subtotal);
  const coupon = await db.query.coupons.findFirst({ where: eq(coupons.code, key) });
  return evaluateCoupon(coupon, subtotal);
}
