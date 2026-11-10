import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, products, reviews } from "@/lib/db/schema";

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Keeps products.rating / reviewCount in sync with the visible reviews. */
export async function refreshProductRating(ex: Executor, productId: number) {
  const [agg] = await ex
    .select({ avg: sql<number | null>`avg(${reviews.rating})`, count: sql<number>`count(*)` })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.hidden, false)));
  await ex
    .update(products)
    .set({ rating: agg.avg ? Math.round(agg.avg * 10) / 10 : 0, reviewCount: Number(agg.count) })
    .where(eq(products.id, productId));
}

/** The delivered order line a user bought this product in, if any ("verified purchase"). */
export async function findPurchase(userId: string, productId: number) {
  const [row] = await db
    .select({ colorNameVi: orderItems.colorNameVi, colorNameEn: orderItems.colorNameEn, size: orderItems.size })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.userId, userId), eq(orders.status, "delivered"), eq(orderItems.productId, productId)))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  return row ?? null;
}
