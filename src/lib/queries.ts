import "server-only";
import { and, asc, count, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  addresses,
  categories,
  coupons,
  orderItems,
  orders,
  products,
  productVariants,
  reviews,
  user,
  type OrderStatus,
  type Product,
} from "@/lib/db/schema";
import { LOW_STOCK_THRESHOLD, toStockMap, type StockMap } from "@/lib/inventory";
import { findPurchase } from "@/lib/reviews";
import { primaryPhoto } from "@/lib/photos";
import { PALETTE } from "@/lib/site";
import { slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

type CardBase = Pick<
  Product,
  | "id"
  | "slug"
  | "nameVi"
  | "nameEn"
  | "price"
  | "compareAtPrice"
  | "kind"
  | "colors"
  | "sizes"
  | "stock"
  | "isNew"
  | "rating"
  | "reviewCount"
  | "imageUrl"
  | "images"
>;

/** A product as shown in grids, with stock per colour x size for quick add. */
export type ProductCardData = CardBase & { stockMap: StockMap };

async function stockMaps(ids: number[]) {
  if (!ids.length) return new Map<number, StockMap>();
  const rows = await db.select().from(productVariants).where(inArray(productVariants.productId, ids));
  const grouped = new Map<number, typeof rows>();
  for (const r of rows) grouped.set(r.productId, [...(grouped.get(r.productId) ?? []), r]);
  return new Map([...grouped].map(([id, list]) => [id, toStockMap(list)]));
}

async function withStock<T extends CardBase>(cards: T[]): Promise<(T & { stockMap: StockMap })[]> {
  const maps = await stockMaps(cards.map((c) => c.id));
  return cards.map((c) => ({ ...c, stockMap: maps.get(c.id) ?? {} }));
}

const cardColumns = {
  id: products.id,
  slug: products.slug,
  nameVi: products.nameVi,
  nameEn: products.nameEn,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  kind: products.kind,
  colors: products.colors,
  sizes: products.sizes,
  stock: products.stock,
  isNew: products.isNew,
  rating: products.rating,
  reviewCount: products.reviewCount,
  imageUrl: products.imageUrl,
  images: products.images,
};

export async function getCategories() {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      nameVi: categories.nameVi,
      nameEn: categories.nameEn,
      kind: categories.kind,
      color: categories.color,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));
  return rows;
}

export async function getFeaturedProducts(limit = 8) {
  return withStock(await db.select(cardColumns).from(products).where(eq(products.featured, true)).orderBy(desc(products.sold)).limit(limit));
}

export async function getNewProducts(limit = 8) {
  return withStock(await db.select(cardColumns).from(products).where(eq(products.isNew, true)).orderBy(desc(products.createdAt)).limit(limit));
}

export async function getSaleProducts(limit = 10) {
  return withStock(
    await db
      .select(cardColumns)
      .from(products)
      .where(sql`${products.compareAtPrice} > ${products.price}`)
      .orderBy(desc(products.sold))
      .limit(limit),
  );
}

export type ShopFilters = {
  q?: string;
  category?: string;
  color?: string;
  size?: string;
  price?: string;
  sale?: string;
  new?: string;
  instock?: string;
  sort?: string;
};

/**
 * The catalogue is small, so filtering happens in memory after one query.
 * This keeps accent-insensitive search simple ("ao thun" matches "Áo thun").
 */
export async function searchProducts(f: ShopFilters) {
  const rows = await db
    .select({
      ...cardColumns,
      categorySlug: categories.slug,
      descriptionVi: products.descriptionVi,
      descriptionEn: products.descriptionEn,
      sold: products.sold,
      createdAt: products.createdAt,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id));

  const q = f.q ? slugify(f.q).replace(/-/g, " ") : "";
  const colorHex = PALETTE.find((c) => c.key === f.color)?.hex.toLowerCase();

  let list = rows.filter((p) => {
    if (f.category && p.categorySlug !== f.category) return false;
    if (colorHex && !p.colors.some((c) => c.hex.toLowerCase() === colorHex)) return false;
    if (f.size && !p.sizes.includes(f.size)) return false;
    if (f.price === "under300" && p.price >= 300_000) return false;
    if (f.price === "300to600" && (p.price < 300_000 || p.price > 600_000)) return false;
    if (f.price === "over600" && p.price <= 600_000) return false;
    if (f.sale === "1" && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
    if (f.new === "1" && !p.isNew) return false;
    if (f.instock === "1" && p.stock <= 0) return false;
    if (q) {
      const haystack = slugify(`${p.nameVi} ${p.nameEn} ${p.descriptionVi} ${p.descriptionEn}`).replace(/-/g, " ");
      if (!q.split(" ").every((word) => haystack.includes(word))) return false;
    }
    return true;
  });

  list = list.sort((a, b) => {
    switch (f.sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "popular":
        return b.sold - a.sold;
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  return withStock(
    list.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameVi: p.nameVi,
    nameEn: p.nameEn,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    kind: p.kind,
    colors: p.colors,
    sizes: p.sizes,
    stock: p.stock,
    isNew: p.isNew,
    rating: p.rating,
    reviewCount: p.reviewCount,
    imageUrl: p.imageUrl,
    images: p.images,
    })) satisfies CardBase[],
  );
}

/** Instant search: a few products plus matching categories. */
export async function searchSuggestions(q: string) {
  const [items, cats] = await Promise.all([searchProducts({ q, sort: "popular" }), getCategories()]);
  const needle = slugify(q).replace(/-/g, " ");
  return {
    products: items.slice(0, 6).map((p) => ({
      id: p.id,
      slug: p.slug,
      nameVi: p.nameVi,
      nameEn: p.nameEn,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      kind: p.kind,
      color: p.colors[0]?.hex ?? "#cccccc",
      imageUrl: p.imageUrl ?? primaryPhoto(p.images, p.colors[0]?.hex),
    })),
    total: items.length,
    categories: cats
      .filter((c) => needle && slugify(`${c.nameVi} ${c.nameEn}`).replace(/-/g, " ").includes(needle))
      .map((c) => ({ slug: c.slug, nameVi: c.nameVi, nameEn: c.nameEn })),
  };
}

export async function getProductBySlug(slug: string) {
  const [row] = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  if (!row) return null;
  const maps = await stockMaps([row.product.id]);
  return { ...row, stockMap: maps.get(row.product.id) ?? {} };
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

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

/** Whether the signed-in user may review a product. */
export async function getReviewEligibility(userId: string | undefined, productId: number) {
  if (!userId) return "signin" as const;
  const existing = await db.query.reviews.findFirst({ where: and(eq(reviews.productId, productId), eq(reviews.userId, userId)), columns: { id: true } });
  if (existing) return "reviewed" as const;
  return (await findPurchase(userId, productId)) ? ("eligible" as const) : ("notPurchased" as const);
}

export async function getRelatedProducts(productId: number, categoryId: number, limit = 4) {
  const same = await db
    .select(cardColumns)
    .from(products)
    .where(and(eq(products.categoryId, categoryId), ne(products.id, productId)))
    .orderBy(desc(products.sold))
    .limit(limit);
  if (same.length >= limit) return withStock(same);
  const exclude = [productId, ...same.map((p) => p.id)];
  const more = await db
    .select(cardColumns)
    .from(products)
    .where(sql`${products.id} not in (${sql.join(exclude.map((id) => sql`${id}`), sql`, `)})`)
    .orderBy(desc(products.sold))
    .limit(limit - same.length);
  return withStock([...same, ...more]);
}

/** "Complete the look": best sellers from other categories, one per category, rotated by product id. */
export async function getCompleteTheLook(productId: number, categoryId: number, limit = 4) {
  const rows = await db
    .select({ ...cardColumns, categoryId: products.categoryId })
    .from(products)
    .where(and(ne(products.categoryId, categoryId), gte(products.stock, 1)))
    .orderBy(desc(products.sold));
  const byCategory = new Map<number, typeof rows>();
  for (const r of rows) byCategory.set(r.categoryId, [...(byCategory.get(r.categoryId) ?? []), r]);
  const picks = [...byCategory.values()].map((list) => list[productId % list.length]);
  const offset = productId % Math.max(1, picks.length);
  const rotated = [...picks.slice(offset), ...picks.slice(0, offset)].slice(0, limit);
  return withStock(rotated.map(({ categoryId: _c, ...card }) => card));
}

export async function getAllProductSlugs() {
  return db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products);
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export async function getOrdersForUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: { items: true },
    orderBy: desc(orders.createdAt),
  });
}

export async function getOrderByCode(code: string) {
  return db.query.orders.findFirst({
    where: eq(orders.code, code.trim().toUpperCase()),
    with: { items: true, events: { orderBy: (e, { asc }) => [asc(e.createdAt), asc(e.id)] } },
  });
}

export async function getUserAddresses(userId: string) {
  return db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export async function getDashboardStats() {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const recent = await db
    .select({ total: orders.total, status: orders.status, createdAt: orders.createdAt })
    .from(orders)
    .where(gte(orders.createdAt, since));

  const valid = recent.filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((s, o) => s + o.total, 0);

  // revenue per day for the last 30 days (Vietnam time)
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = 29; i >= 0; i--) {
    byDay.set(fmt.format(new Date(Date.now() - i * 86_400_000)), { revenue: 0, orders: 0 });
  }
  for (const o of valid) {
    const key = fmt.format(o.createdAt);
    const day = byDay.get(key);
    if (day) {
      day.revenue += o.total;
      day.orders += 1;
    }
  }

  const statusCounts = Object.fromEntries(
    (["pending", "confirmed", "shipping", "delivered", "cancelled"] as OrderStatus[]).map((s) => [
      s,
      recent.filter((o) => o.status === s).length,
    ]),
  ) as Record<OrderStatus, number>;

  // distinct buyers (guest checkouts included)
  const [{ customers }] = await db.select({ customers: sql<number>`count(distinct lower(${orders.email}))` }).from(orders);

  const top = await db
    .select({
      productId: orderItems.productId,
      slug: orderItems.slug,
      nameVi: orderItems.nameVi,
      nameEn: orderItems.nameEn,
      kind: orderItems.kind,
      colorHex: sql<string>`min(${orderItems.colorHex})`,
      imageUrl: sql<string | null>`min(${orderItems.imageUrl})`,
      quantity: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.price})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(gte(orders.createdAt, since), ne(orders.status, "cancelled")))
    .groupBy(orderItems.productId, orderItems.slug, orderItems.nameVi, orderItems.nameEn, orderItems.kind)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  const latest = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6);

  // money still to collect: bank/VNPay orders not paid yet
  const [{ awaitingPayment }] = await db
    .select({ awaitingPayment: sql<number>`count(*)` })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "unpaid"), ne(orders.paymentMethod, "cod"), ne(orders.status, "cancelled")));

  return {
    revenue,
    orderCount: valid.length,
    avgOrder: valid.length ? Math.round(revenue / valid.length) : 0,
    customers,
    daily: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
    statusCounts,
    top,
    latest,
    awaitingPayment: Number(awaitingPayment),
  };
}

export async function getLowStockVariants(limit = 8) {
  return db
    .select({
      id: productVariants.id,
      productId: products.id,
      nameVi: products.nameVi,
      nameEn: products.nameEn,
      kind: products.kind,
      colors: products.colors,
      images: products.images,
      colorHex: productVariants.colorHex,
      size: productVariants.size,
      stock: productVariants.stock,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(lte(productVariants.stock, LOW_STOCK_THRESHOLD))
    .orderBy(asc(productVariants.stock), desc(products.sold))
    .limit(limit);
}

export async function getOrderDetail(orderId: number) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: true,
      events: { orderBy: (e, { asc }) => [asc(e.createdAt), asc(e.id)] },
      user: { columns: { id: true, name: true, email: true } },
    },
  });
}

export async function getAdminCoupons() {
  return db.select().from(coupons).orderBy(desc(coupons.active), desc(coupons.createdAt));
}

/** Registered customers with what they have spent (cancelled orders excluded). */
export async function getCustomers(q?: string) {
  const spent = sql<number>`coalesce(sum(case when ${orders.status} != 'cancelled' then ${orders.total} else 0 end), 0)`;
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      orderCount: sql<number>`count(${orders.id})`,
      spent,
      lastOrder: sql<number | null>`max(${orders.createdAt})`,
    })
    .from(user)
    .leftJoin(orders, eq(orders.userId, user.id))
    .groupBy(user.id)
    .orderBy(desc(spent), desc(user.createdAt));
  const list = rows.map((r) => ({
    ...r,
    orderCount: Number(r.orderCount),
    spent: Number(r.spent),
    lastOrder: r.lastOrder ? new Date(Number(r.lastOrder) * 1000) : null,
  }));
  if (!q) return list;
  const needle = slugify(q).replace(/-/g, " ");
  return list.filter((r) => slugify(`${r.name} ${r.email}`).replace(/-/g, " ").includes(needle));
}

export async function getAdminReviews(filter?: string) {
  return db
    .select({
      review: reviews,
      productSlug: products.slug,
      productNameVi: products.nameVi,
      productNameEn: products.nameEn,
      kind: products.kind,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .where(filter === "hidden" ? eq(reviews.hidden, true) : filter === "low" ? lte(reviews.rating, 3) : undefined)
    .orderBy(desc(reviews.createdAt))
    .limit(200);
}

export async function getOrdersForExport(status?: string) {
  const valid = ["pending", "confirmed", "shipping", "delivered", "cancelled"];
  return db.query.orders.findMany({
    where: status && valid.includes(status) ? eq(orders.status, status as OrderStatus) : undefined,
    with: { items: true },
    orderBy: desc(orders.createdAt),
  });
}

export async function getAdminProducts(q?: string) {
  const rows = await db
    .select({ product: products, categoryVi: categories.nameVi, categoryEn: categories.nameEn })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.updatedAt));
  if (!q) return rows;
  const needle = slugify(q).replace(/-/g, " ");
  return rows.filter((r) =>
    slugify(`${r.product.nameVi} ${r.product.nameEn}`).replace(/-/g, " ").includes(needle),
  );
}

export async function getProductById(id: number) {
  return db.query.products.findFirst({ where: eq(products.id, id), with: { variants: true } });
}

export async function getAdminOrders(opts: { status?: string; payment?: string; q?: string } = {}) {
  const valid = ["pending", "confirmed", "shipping", "delivered", "cancelled"];
  const conds = [];
  if (opts.status && valid.includes(opts.status)) conds.push(eq(orders.status, opts.status as OrderStatus));
  if (opts.payment === "unpaid") conds.push(eq(orders.paymentStatus, "unpaid"), ne(orders.status, "cancelled"));
  const rows = await db.query.orders.findMany({
    where: conds.length ? and(...conds) : undefined,
    with: { items: true },
    orderBy: desc(orders.createdAt),
    limit: 200,
  });
  if (!opts.q) return rows;
  const needle = opts.q.trim().toLowerCase();
  return rows.filter((o) => `${o.code} ${o.customerName} ${o.email} ${o.phone}`.toLowerCase().includes(needle));
}

export async function getProductsByIds(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(products).where(inArray(products.id, ids));
}

/* ------------------------------------------------------------------ */
/* Home page extras                                                    */
/* ------------------------------------------------------------------ */

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

export async function getProductsBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  return db.select(cardColumns).from(products).where(inArray(products.slug, slugs));
}
