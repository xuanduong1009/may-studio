import { relations, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { COUPON_TYPES, ORDER_EVENT_TYPES, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, REVIEW_FITS } from "../constants";

export * from "../constants";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* Auth tables (shape required by Better Auth)                         */
/* ------------------------------------------------------------------ */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["user", "admin", "viewer"] }).notNull().default("user"),
  ...timestamps,
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Store tables                                                        */
/* ------------------------------------------------------------------ */

export type ProductColor = { nameVi: string; nameEn: string; hex: string };
/** A product photo, optionally tied to one colour variant. */
export type ProductPhoto = { url: string; colorHex: string | null };

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  /** garment shape used for the category tile illustration */
  kind: text("kind").notNull(),
  color: text("color").notNull().default("#d9cbb5"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    nameVi: text("name_vi").notNull(),
    nameEn: text("name_en").notNull(),
    descriptionVi: text("description_vi").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    /** price in VND */
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    kind: text("kind").notNull(),
    colors: text("colors", { mode: "json" }).$type<ProductColor[]>().notNull().default(sql`'[]'`),
    sizes: text("sizes", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    stock: integer("stock").notNull().default(0),
    sold: integer("sold").notNull().default(0),
    rating: real("rating").notNull().default(5),
    reviewCount: integer("review_count").notNull().default(0),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    isNew: integer("is_new", { mode: "boolean" }).notNull().default(false),
    imageUrl: text("image_url"),
    images: text("images", { mode: "json" }).$type<ProductPhoto[]>().notNull().default(sql`'[]'`),
    ...timestamps,
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);


export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    note: text("note"),
    shippingMethod: text("shipping_method", { enum: ["standard", "express"] }).notNull(),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull(),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES }).notNull().default("unpaid"),
    /** bank / gateway transaction reference once paid */
    paymentRef: text("payment_ref"),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    /** language used for customer emails */
    locale: text("locale", { enum: ["vi", "en"] }).notNull().default("vi"),
    couponCode: text("coupon_code"),
    subtotal: integer("subtotal").notNull(),
    shippingFee: integer("shipping_fee").notNull(),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
    ...timestamps,
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    nameVi: text("name_vi").notNull(),
    nameEn: text("name_en").notNull(),
    kind: text("kind").notNull(),
    colorNameVi: text("color_name_vi").notNull(),
    colorNameEn: text("color_name_en").notNull(),
    colorHex: text("color_hex").notNull(),
    size: text("size").notNull(),
    /** photo of the purchased colour at the time of the order */
    imageUrl: text("image_url"),
    price: integer("price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/** Stock is tracked per colour × size. products.stock caches the sum for listings. */
export const productVariants = sqliteTable(
  "product_variants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    colorHex: text("color_hex").notNull(),
    size: text("size").notNull(),
    stock: integer("stock").notNull().default(0),
  },
  (t) => [uniqueIndex("variants_unique").on(t.productId, t.colorHex, t.size)],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull(),
    fit: text("fit", { enum: REVIEW_FITS }),
    /** e.g. "Đen / M" — what the reviewer bought */
    variant: text("variant"),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index("reviews_product_idx").on(t.productId), uniqueIndex("reviews_user_product").on(t.productId, t.userId)],
);

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  type: text("type", { enum: COUPON_TYPES }).notNull(),
  /** percent (1-100) or amount in VND; ignored for freeship */
  value: integer("value").notNull().default(0),
  maxDiscount: integer("max_discount"),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: integer("starts_at", { mode: "timestamp" }),
  endsAt: integer("ends_at", { mode: "timestamp" }),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  descriptionVi: text("description_vi").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  ...timestamps,
});

/** Audit trail for every order: status changes, payments, notes. */
export const orderEvents = sqliteTable(
  "order_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: text("type", { enum: ORDER_EVENT_TYPES }).notNull(),
    status: text("status"),
    message: text("message"),
    /** who did it: a user name, "customer" or "system" */
    actor: text("actor").notNull().default("system"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

export const addresses = sqliteTable(
  "addresses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull().default(""),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
  reviews: many(reviews),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  events: many(orderEvents),
  user: one(user, { fields: [orders.userId], references: [user.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Address = typeof addresses.$inferSelect;
