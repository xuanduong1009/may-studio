/** Review reads: a product's reviews, who may write one, and the home page wall. */
import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, reviews } from "@/lib/db/schema";
import { primaryPhoto } from "@/lib/photos/gallery";
import { findPurchase } from "@/lib/server/reviews";

export async function getProductReviews(productId: number) {
  const list = await db
    .select({
      id: reviews.id,
      authorName: reviews.authorName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      fit: reviews.fit,
      variant: reviews.variant,
      verified: reviews.verified,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.hidden, false)))
    .orderBy(desc(reviews.createdAt))
    .limit(100);
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: list.filter((r) => r.rating === star).length }));
  const fits = { small: 0, true: 0, large: 0 };
  for (const r of list) if (r.fit) fits[r.fit]++;
  return { list, distribution, fits };
}

/** Products the user has already reviewed (to hide "write a review" links). */
export async function getReviewedProductIds(userId: string) {
  const rows = await db.select({ productId: reviews.productId }).from(reviews).where(eq(reviews.userId, userId));
  return new Set(rows.map((r) => r.productId));
}

/** Whether the signed-in user may review a product. */
export async function getReviewEligibility(userId: string | undefined, productId: number) {
  if (!userId) return "signin" as const;
  const existing = await db.query.reviews.findFirst({ where: and(eq(reviews.productId, productId), eq(reviews.userId, userId)), columns: { id: true } });
  if (existing) return "reviewed" as const;
  return (await findPurchase(userId, productId)) ? ("eligible" as const) : ("notPurchased" as const);
}

/** Recent 4–5 star reviews with some substance, for the home page wall. */
export async function getHighlightReviews(limit = 14) {
  const rows = await db
    .select({
      id: reviews.id,
      authorName: reviews.authorName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      verified: reviews.verified,
      slug: products.slug,
      nameVi: products.nameVi,
      nameEn: products.nameEn,
      kind: products.kind,
      colors: products.colors,
      images: products.images,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .where(and(eq(reviews.hidden, false), gte(reviews.rating, 4), sql`length(${reviews.body}) > 30`))
    .orderBy(desc(reviews.createdAt))
    .limit(limit * 3);
  // one review per product keeps the wall varied
  const seen = new Set<string>();
  return rows
    .filter((r) => (seen.has(r.slug) ? false : (seen.add(r.slug), true)))
    .slice(0, limit)
    .map(({ colors, images, ...r }) => ({ ...r, color: colors[0]?.hex ?? "#cccccc", image: primaryPhoto(images, colors[0]?.hex) }));
}
