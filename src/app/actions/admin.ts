"use server";

import { randomBytes } from "node:crypto";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { coupons, ORDER_STATUSES, orders, productImages, products, productVariants, reviews, user } from "@/lib/db/schema";
import { variantKey } from "@/lib/inventory";
import { IMAGE_ROUTE, MAX_IMAGE_BYTES, sniffImageType } from "@/lib/photos/uploads";
import { afterResponse, changeOrderStatus, logEvent, markOrderPaid } from "@/lib/server/orders";
import { pruneUnusedImages } from "@/lib/server/photo-cleanup";
import { refreshProductRating } from "@/lib/server/reviews";
import { getSession, isAdmin, type Session } from "@/lib/server/session";
import { couponSchema, productSchema, type CouponInput, type ProductInput } from "@/lib/validators";

export type ActionResult =
  | { ok: true; id?: number }
  | { ok: false; error: "readonly" | "unauthorized" | "invalid" | "conflict" | "transition" | "notFound" | "self" | "generic"; fields?: string[] };

/** Every admin mutation goes through this guard: only real admins may write. */
async function guard(): Promise<{ ok: false; result: ActionResult } | { ok: true; session: NonNullable<Session> }> {
  const session = await getSession();
  if (!session) return { ok: false, result: { ok: false, error: "unauthorized" } };
  if (session.user.role === "viewer") return { ok: false, result: { ok: false, error: "readonly" } };
  if (!isAdmin(session)) return { ok: false, result: { ok: false, error: "unauthorized" } };
  return { ok: true, session };
}

function refresh() {
  revalidatePath("/", "layout");
}

const id = z.number().int().positive();

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export async function saveProduct(productId: number | null, input: ProductInput): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  }
  const { variants, ...rest } = parsed.data;

  // full colour × size matrix; combinations left out get 0 stock
  const given = new Map(variants.map((v) => [variantKey(v.colorHex, v.size), v.stock]));
  const matrix = rest.colors.flatMap((c) =>
    rest.sizes.map((size) => ({ colorHex: c.hex.toLowerCase(), size, stock: given.get(variantKey(c.hex, size)) ?? 0 })),
  );
  const data = {
    ...rest,
    colors: rest.colors.map((c) => ({ ...c, hex: c.hex.toLowerCase() })),
    images: rest.images.map((im) => ({ url: im.url, colorHex: im.colorHex ? im.colorHex.toLowerCase() : null })),
    compareAtPrice: rest.compareAtPrice && rest.compareAtPrice > rest.price ? rest.compareAtPrice : null,
    stock: matrix.reduce((s, v) => s + v.stock, 0),
  };

  try {
    const clash = await db.query.products.findFirst({ where: eq(products.slug, data.slug), columns: { id: true } });
    if (clash && clash.id !== productId) return { ok: false, error: "conflict", fields: ["slug"] };

    const savedId = await db.transaction(async (tx) => {
      let pid = productId;
      if (pid) {
        const res = await tx.update(products).set(data).where(eq(products.id, pid)).returning({ id: products.id });
        if (!res.length) throw new Error("notFound");
      } else {
        const [row] = await tx.insert(products).values(data).returning({ id: products.id });
        pid = row.id;
      }
      // drop variants for removed colours/sizes, then upsert the rest
      const keep = matrix.map((v) => `${v.colorHex}|${v.size}`);
      await tx
        .delete(productVariants)
        .where(and(eq(productVariants.productId, pid), notInArray(sql`lower(${productVariants.colorHex}) || '|' || ${productVariants.size}`, keep)));
      for (const v of matrix) {
        await tx
          .insert(productVariants)
          .values({ productId: pid, ...v })
          .onConflictDoUpdate({ target: [productVariants.productId, productVariants.colorHex, productVariants.size], set: { stock: v.stock } });
      }
      return pid;
    });
    refresh();
    afterResponse(pruneUnusedImages);
    return { ok: true, id: savedId };
  } catch (err) {
    console.error("saveProduct failed", err);
    return { ok: false, error: "generic" };
  }
}

export type UploadResult = { ok: true; url: string } | { ok: false; error: "readonly" | "unauthorized" | "invalid" | "tooLarge" };

/**
 * Stores one product photo (already shrunk in the browser) and returns its URL.
 * The file type is checked from its bytes; only JPEG, PNG and WebP are accepted.
 */
export async function uploadProductImage(formData: FormData): Promise<UploadResult> {
  const g = await guard();
  if (!g.ok) return { ok: false, error: "error" in g.result && g.result.error === "readonly" ? "readonly" : "unauthorized" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "invalid" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "tooLarge" };
  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniffImageType(data);
  if (!mime) return { ok: false, error: "invalid" };
  const imageId = randomBytes(12).toString("base64url");
  await db.insert(productImages).values({ id: imageId, mime, data, size: data.length });
  return { ok: true, url: `${IMAGE_ROUTE}${imageId}` };
}

export async function deleteProduct(productId: number): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  try {
    await db.delete(products).where(eq(products.id, id.parse(productId)));
    refresh();
    afterResponse(pruneUnusedImages);
    return { ok: true };
  } catch (err) {
    console.error("deleteProduct failed", err);
    return { ok: false, error: "generic" };
  }
}

/** Quick restock from the low-stock list. */
export async function setVariantStock(variantId: number, stock: number): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  const parsed = z.object({ variantId: id, stock: z.number().int().min(0).max(100_000) }).safeParse({ variantId, stock });
  if (!parsed.success) return { ok: false, error: "invalid" };
  await db.transaction(async (tx) => {
    const [v] = await tx.update(productVariants).set({ stock: parsed.data.stock }).where(eq(productVariants.id, parsed.data.variantId)).returning();
    if (!v) return;
    await tx
      .update(products)
      .set({ stock: sql`(select coalesce(sum(stock), 0) from ${productVariants} where ${productVariants.productId} = ${v.productId})` })
      .where(eq(products.id, v.productId));
  });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export async function updateOrderStatus(orderId: number, status: string, note?: string): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  const { session } = g;
  const parsed = z
    .object({ orderId: id, status: z.enum(ORDER_STATUSES), note: z.string().trim().max(300).optional() })
    .safeParse({ orderId, status, note });
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const res = await changeOrderStatus(parsed.data.orderId, parsed.data.status, session.user.name, parsed.data.note || undefined);
    refresh();
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  } catch (err) {
    console.error("updateOrderStatus failed", err);
    return { ok: false, error: "generic" };
  }
}

/** Manual payment confirmation (e.g. a bank transfer checked by hand). */
export async function confirmPayment(orderId: number): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  const { session } = g;
  const res = await markOrderPaid(id.parse(orderId), { actor: session.user.name, method: "manual" });
  refresh();
  return res.ok ? { ok: true } : { ok: false, error: res.error === "notFound" ? "notFound" : "transition" };
}

export async function addOrderNote(orderId: number, note: string): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  const { session } = g;
  const parsed = z.object({ orderId: id, note: z.string().trim().min(1).max(500) }).safeParse({ orderId, note });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const exists = await db.query.orders.findFirst({ where: eq(orders.id, parsed.data.orderId), columns: { id: true } });
  if (!exists) return { ok: false, error: "notFound" };
  await logEvent(db, parsed.data.orderId, "note", { message: parsed.data.note, actor: session.user.name });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Coupons                                                             */
/* ------------------------------------------------------------------ */

export async function saveCoupon(couponId: number | null, input: CouponInput): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  const data = { ...parsed.data, value: parsed.data.type === "freeship" ? 0 : parsed.data.value };
  try {
    const clash = await db.query.coupons.findFirst({ where: eq(coupons.code, data.code), columns: { id: true } });
    if (clash && clash.id !== couponId) return { ok: false, error: "conflict", fields: ["code"] };
    if (couponId) {
      await db.update(coupons).set(data).where(eq(coupons.id, couponId));
      refresh();
      return { ok: true, id: couponId };
    }
    const [row] = await db.insert(coupons).values(data).returning({ id: coupons.id });
    refresh();
    return { ok: true, id: row.id };
  } catch (err) {
    console.error("saveCoupon failed", err);
    return { ok: false, error: "generic" };
  }
}

export async function toggleCoupon(couponId: number, active: boolean): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  await db.update(coupons).set({ active: !!active }).where(eq(coupons.id, id.parse(couponId)));
  refresh();
  return { ok: true };
}

export async function deleteCoupon(couponId: number): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  await db.delete(coupons).where(eq(coupons.id, id.parse(couponId)));
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Customers & reviews                                                 */
/* ------------------------------------------------------------------ */

export async function setUserRole(userId: string, role: string): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  const { session } = g;
  const parsed = z.object({ userId: z.string().min(1).max(100), role: z.enum(["user", "admin", "viewer"]) }).safeParse({ userId, role });
  if (!parsed.success) return { ok: false, error: "invalid" };
  // an admin cannot demote themselves and lock everyone out
  if (parsed.data.userId === session.user.id) return { ok: false, error: "self" };
  await db.update(user).set({ role: parsed.data.role }).where(eq(user.id, parsed.data.userId));
  refresh();
  return { ok: true };
}

export async function setReviewHidden(reviewId: number, hidden: boolean): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  const [row] = await db.update(reviews).set({ hidden: !!hidden }).where(eq(reviews.id, id.parse(reviewId))).returning({ productId: reviews.productId });
  if (!row) return { ok: false, error: "notFound" };
  await refreshProductRating(db, row.productId);
  refresh();
  return { ok: true };
}

export async function deleteReview(reviewId: number): Promise<ActionResult> {
  const g = await guard();
  if (!g.ok) return g.result;
  const [row] = await db.delete(reviews).where(eq(reviews.id, id.parse(reviewId))).returning({ productId: reviews.productId });
  if (!row) return { ok: false, error: "notFound" };
  await refreshProductRating(db, row.productId);
  refresh();
  return { ok: true };
}
