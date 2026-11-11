/** Back-office reads: dashboard, orders, products, coupons, customers and reviews. */
import "server-only";
import { and, asc, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isOrderStatus, ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { categories, coupons, orderItems, orders, products, productVariants, reviews, user } from "@/lib/db/schema";
import { LOW_STOCK_THRESHOLD } from "@/lib/inventory";
import { searchText } from "@/lib/utils";

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

  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, recent.filter((o) => o.status === s).length])) as Record<OrderStatus, number>;

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
  const needle = searchText(q);
  return list.filter((r) => searchText(`${r.name} ${r.email}`).includes(needle));
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
  return db.query.orders.findMany({
    where: isOrderStatus(status) ? eq(orders.status, status) : undefined,
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
  const needle = searchText(q);
  return rows.filter((r) => searchText(`${r.product.nameVi} ${r.product.nameEn}`).includes(needle));
}

export async function getProductById(id: number) {
  return db.query.products.findFirst({ where: eq(products.id, id), with: { variants: true } });
}

export async function getAdminOrders(opts: { status?: string; payment?: string; q?: string } = {}) {
  const conds = [];
  if (isOrderStatus(opts.status)) conds.push(eq(orders.status, opts.status));
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
