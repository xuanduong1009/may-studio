"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { addresses, reviews } from "@/lib/db/schema";
import { allow } from "@/lib/server/rate-limit";
import { findPurchase, refreshProductRating } from "@/lib/server/reviews";
import { getSession } from "@/lib/server/session";
import { addressSchema, reviewSchema, type AddressInput, type ReviewInput } from "@/lib/validators";

type Result = { ok: true } | { ok: false; error: "unauthorized" | "invalid" | "notPurchased" | "duplicate" | "rateLimited" | "generic"; fields?: string[] };

/* ------------------------------------------------------------------ */
/* Address book                                                        */
/* ------------------------------------------------------------------ */

export async function saveAddress(addressId: number | null, input: AddressInput): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  const userId = session.user.id;

  await db.transaction(async (tx) => {
    const count = (await tx.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId))).length;
    const isDefault = parsed.data.isDefault || count === 0 || (count === 1 && addressId !== null);
    if (isDefault) await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    if (addressId) {
      await tx
        .update(addresses)
        .set({ ...parsed.data, isDefault })
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));
    } else {
      await tx.insert(addresses).values({ ...parsed.data, isDefault, userId });
    }
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAddress(addressId: number): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };
  const userId = session.user.id;
  await db.transaction(async (tx) => {
    const [removed] = await tx
      .delete(addresses)
      .where(and(eq(addresses.id, z.number().int().parse(addressId)), eq(addresses.userId, userId)))
      .returning();
    // promote another address if the default one was removed
    if (removed?.isDefault) {
      const [next] = await tx.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, userId)).limit(1);
      if (next) await tx.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
    }
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setDefaultAddress(addressId: number): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };
  const userId = session.user.id;
  await db.transaction(async (tx) => {
    await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    await tx
      .update(addresses)
      .set({ isDefault: true })
      .where(and(eq(addresses.id, z.number().int().parse(addressId)), eq(addresses.userId, userId)));
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

/** Only customers who received the product can review it, once. */
export async function submitReview(input: ReviewInput, locale: string): Promise<Result> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };
  if (!(await allow("review", `user:${session.user.id}`))) return { ok: false, error: "rateLimited" };
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: parsed.error.issues.map((i) => String(i.path[0])) };
  const data = parsed.data;

  const purchase = await findPurchase(session.user.id, data.productId);
  if (!purchase) return { ok: false, error: "notPurchased" };
  const existing = await db.query.reviews.findFirst({
    where: and(eq(reviews.productId, data.productId), eq(reviews.userId, session.user.id)),
    columns: { id: true },
  });
  if (existing) return { ok: false, error: "duplicate" };

  try {
    await db.insert(reviews).values({
      productId: data.productId,
      userId: session.user.id,
      authorName: session.user.name,
      rating: data.rating,
      title: data.title,
      body: data.body,
      fit: data.fit,
      variant: `${locale === "en" ? purchase.colorNameEn : purchase.colorNameVi} / ${purchase.size}`,
      verified: true,
    });
  } catch (err) {
    // two submissions racing past the check above hit the unique index
    if (/UNIQUE/i.test(`${err} ${(err as { cause?: unknown })?.cause ?? ""}`)) return { ok: false, error: "duplicate" };
    console.error("submitReview failed", err);
    return { ok: false, error: "generic" };
  }
  await refreshProductRating(db, data.productId);
  revalidatePath("/", "layout");
  return { ok: true };
}
