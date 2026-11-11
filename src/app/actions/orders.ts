"use server";

import { and, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { addresses, coupons, orderItems, orders, products, productVariants } from "@/lib/db/schema";
import { orderConfirmationEmail, sendEmail } from "@/lib/email";
import { variantKey } from "@/lib/inventory";
import { primaryPhoto } from "@/lib/photos";
import { afterResponse, canAccessOrder, changeOrderStatus, checkCoupon, generateOrderCode, logEvent, markOrderPaid } from "@/lib/orders";
import { bankDemoMode, bankTransferEnabled } from "@/lib/payments/vietqr";
import { buildVnpayUrl, codeToTxnRef, vnpayConfig } from "@/lib/payments/vnpay";
import { computeTotals, expressAvailable, type CouponCheck } from "@/lib/pricing";
import { allow } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { site } from "@/lib/site";
import { checkoutSchema, orderItemsSchema, type CheckoutInput } from "@/lib/validators";

export type PlaceOrderResult =
  | { ok: true; code: string; redirectUrl?: string }
  | {
      ok: false;
      error: "invalid" | "stock" | "coupon" | "express" | "payment" | "rateLimited" | "generic";
      productName?: string;
      reason?: Extract<CouponCheck, { ok: false }>["reason"];
    };

class StockError extends Error {
  constructor(public productName: string) {
    super("stock");
  }
}
class CouponError extends Error {}

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "127.0.0.1";
}

async function vnpayUrlFor(order: { code: string; total: number }, locale: string) {
  const config = vnpayConfig();
  if (!config) return null;
  return buildVnpayUrl(config, {
    txnRef: codeToTxnRef(order.code),
    amount: order.total,
    orderInfo: `Thanh toan don hang ${codeToTxnRef(order.code)}`,
    ipAddr: await clientIp(),
    returnUrl: `${site.url}/api/payments/vnpay/return`,
    locale,
  });
}

/** Live coupon check for the checkout page. The order itself re-checks it. */
export async function previewCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  if (typeof code !== "string" || code.length > 30 || !Number.isFinite(subtotal)) return { ok: false, reason: "notFound" };
  if (!(await allow("coupon"))) return { ok: false, reason: "rateLimited" };
  return checkCoupon(code, Math.max(0, Math.round(subtotal)));
}

/**
 * Places an order. Prices, discounts and shipping are recalculated on the
 * server from the database — values sent by the browser are never trusted.
 * Stock is reserved per colour × size inside one transaction.
 */
export async function placeOrder(
  form: CheckoutInput,
  cart: { productId: number; colorHex: string; size: string; quantity: number }[],
  locale: string,
): Promise<PlaceOrderResult> {
  const parsedForm = checkoutSchema.safeParse(form);
  const parsedItems = orderItemsSchema.safeParse(cart);
  if (!parsedForm.success || !parsedItems.success) return { ok: false, error: "invalid" };
  if (!(await allow("order"))) return { ok: false, error: "rateLimited" };
  const data = parsedForm.data;
  const items = parsedItems.data;
  const lang = locale === "en" ? "en" : "vi";

  if (data.shippingMethod === "express" && !expressAvailable(data.city)) return { ok: false, error: "express" };
  if (data.paymentMethod === "vnpay" && !vnpayConfig()) return { ok: false, error: "payment" };
  if (data.paymentMethod === "bank" && !bankTransferEnabled()) return { ok: false, error: "payment" };

  const session = await getSession();
  const ids = [...new Set(items.map((i) => i.productId))];
  const [rows, variantRows] = await Promise.all([
    db.select().from(products).where(inArray(products.id, ids)),
    db.select().from(productVariants).where(inArray(productVariants.productId, ids)),
  ]);
  const byId = new Map(rows.map((p) => [p.id, p]));
  const variantBy = new Map(variantRows.map((v) => [`${v.productId}:${variantKey(v.colorHex, v.size)}`, v]));

  // validate every line against the catalogue
  type Line = { product: (typeof rows)[number]; color: (typeof rows)[number]["colors"][number]; size: string; quantity: number };
  const lines: Line[] = [];
  const qtyPerVariant = new Map<number, { qty: number; product: Line["product"] }>();
  const qtyPerProduct = new Map<number, number>();
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) return { ok: false, error: "invalid" };
    const color = p.colors.find((c) => c.hex.toLowerCase() === item.colorHex.toLowerCase());
    if (!color || !p.sizes.includes(item.size)) return { ok: false, error: "invalid" };
    const variant = variantBy.get(`${p.id}:${variantKey(color.hex, item.size)}`);
    const name = `${lang === "vi" ? p.nameVi : p.nameEn} (${lang === "vi" ? color.nameVi : color.nameEn} / ${item.size})`;
    if (!variant) return { ok: false, error: "stock", productName: name };
    const prev = qtyPerVariant.get(variant.id)?.qty ?? 0;
    if (variant.stock < prev + item.quantity) return { ok: false, error: "stock", productName: name };
    qtyPerVariant.set(variant.id, { qty: prev + item.quantity, product: p });
    qtyPerProduct.set(p.id, (qtyPerProduct.get(p.id) ?? 0) + item.quantity);
    lines.push({ product: p, color, size: item.size, quantity: item.quantity });
  }

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
  let couponRule = null;
  if (data.couponCode) {
    const check = await checkCoupon(data.couponCode, subtotal);
    if (!check.ok) return { ok: false, error: "coupon", reason: check.reason };
    couponRule = check.rule;
  }
  const totals = computeTotals({ subtotal, shippingMethod: data.shippingMethod, coupon: couponRule });

  try {
    const orderId = await db.transaction(async (tx) => {
      // reserve stock atomically; fails if someone bought the last items meanwhile
      for (const [variantId, { qty, product }] of qtyPerVariant) {
        const res = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${qty}` })
          .where(and(eq(productVariants.id, variantId), gte(productVariants.stock, qty)))
          .returning({ id: productVariants.id });
        if (res.length === 0) throw new StockError(lang === "vi" ? product.nameVi : product.nameEn);
      }
      for (const [id, qty] of qtyPerProduct) {
        await tx
          .update(products)
          .set({ stock: sql`max(0, ${products.stock} - ${qty})`, sold: sql`${products.sold} + ${qty}` })
          .where(eq(products.id, id));
      }

      // claim one use of the coupon; fails if its last use was just taken
      if (totals.couponCode) {
        const claimed = await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(
            and(
              eq(coupons.code, totals.couponCode),
              eq(coupons.active, true),
              or(isNull(coupons.usageLimit), lt(coupons.usedCount, coupons.usageLimit)),
            ),
          )
          .returning({ id: coupons.id });
        if (claimed.length === 0) throw new CouponError();
      }

      const [order] = await tx
        .insert(orders)
        .values({
          code: generateOrderCode(),
          userId: session?.user.id ?? null,
          customerName: data.name,
          phone: data.phone,
          email: data.email.toLowerCase(),
          address: data.address,
          city: data.city,
          note: data.note || null,
          shippingMethod: data.shippingMethod,
          paymentMethod: data.paymentMethod,
          locale: lang,
          couponCode: totals.couponCode,
          subtotal: totals.subtotal,
          shippingFee: totals.shippingFee,
          discount: totals.discount,
          total: totals.total,
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          productId: l.product.id,
          slug: l.product.slug,
          nameVi: l.product.nameVi,
          nameEn: l.product.nameEn,
          kind: l.product.kind,
          colorNameVi: l.color.nameVi,
          colorNameEn: l.color.nameEn,
          colorHex: l.color.hex,
          size: l.size,
          imageUrl: primaryPhoto(l.product.images, l.color.hex) ?? l.product.imageUrl,
          price: l.product.price,
          quantity: l.quantity,
        })),
      );
      await logEvent(tx, order.id, "created", { status: "pending", actor: data.name });

      // remember the address for next time
      if (session && data.saveAddress) {
        const existing = await tx.select({ id: addresses.id, address: addresses.address }).from(addresses).where(eq(addresses.userId, session.user.id));
        if (!existing.some((a) => a.address.toLowerCase() === data.address.toLowerCase())) {
          await tx.insert(addresses).values({
            userId: session.user.id,
            fullName: data.name,
            phone: data.phone,
            address: data.address,
            city: data.city,
            isDefault: existing.length === 0,
          });
        }
      }
      return order.id;
    });

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
    if (!order) return { ok: false, error: "generic" };
    afterResponse(() => sendEmail(orderConfirmationEmail(order)));
    revalidatePath("/", "layout");

    if (order.paymentMethod === "vnpay") {
      const redirectUrl = await vnpayUrlFor(order, lang);
      return { ok: true, code: order.code, redirectUrl: redirectUrl ?? undefined };
    }
    return { ok: true, code: order.code };
  } catch (err) {
    if (err instanceof StockError) return { ok: false, error: "stock", productName: err.productName };
    if (err instanceof CouponError) return { ok: false, error: "coupon", reason: "exhausted" };
    console.error("placeOrder failed", err);
    return { ok: false, error: "generic" };
  }
}

/** New VNPay link for an unpaid order (e.g. after the customer closed the payment page). */
export async function retryVnpayPayment(code: string, locale: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.code, String(code).toUpperCase()) });
  if (!order || order.paymentMethod !== "vnpay" || order.paymentStatus !== "unpaid" || order.status === "cancelled") return null;
  return vnpayUrlFor(order, locale);
}

async function findOwnedOrder(code: string, contact?: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.code, String(code).trim().toUpperCase()) });
  if (!order) return null;
  const session = await getSession();
  return canAccessOrder(order, session?.user.id, contact) ? order : null;
}

export async function cancelOrder(code: string, contact?: string) {
  if (!(await allow("orderAction"))) return { ok: false as const, error: "notFound" as const };
  const order = await findOwnedOrder(code, contact);
  if (!order) return { ok: false as const, error: "notFound" as const };
  if (order.status !== "pending") return { ok: false as const, error: "transition" as const };
  const res = await changeOrderStatus(order.id, "cancelled", "customer", "Customer cancelled");
  revalidatePath("/", "layout");
  return res.ok ? { ok: true as const } : { ok: false as const, error: res.error };
}

/**
 * Local demo mode only (no bank account configured, not production): pretends
 * the bank webhook arrived so the automatic payment confirmation can be tested.
 */
export async function simulateBankPayment(code: string) {
  if (!bankDemoMode()) return { ok: false as const };
  if (!(await allow("orderAction"))) return { ok: false as const };
  const order = await db.query.orders.findFirst({ where: eq(orders.code, String(code).toUpperCase()) });
  if (!order || order.paymentMethod !== "bank") return { ok: false as const };
  const res = await markOrderPaid(order.id, { ref: `DEMO-${Date.now().toString(36).toUpperCase()}`, actor: "bank-webhook (demo)", amount: order.total, method: "VietQR" });
  revalidatePath("/", "layout");
  return { ok: res.ok };
}
