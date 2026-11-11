/**
 * Seeds the database. Run "npm run db:push" first to create the tables.
 *
 *   npm run db:seed           full demo: sample catalogue + demo accounts, 72 orders, reviews, coupons
 *   npm run db:seed:catalog   launch mode: sample catalogue only, ready to take real orders.
 *                             Removes demo orders, reviews and coupons and the two public demo
 *                             accounts; real customer accounts and their address books are kept.
 *
 * Store data (products, orders, reviews, coupons) is replaced on every run. On a hosted
 * database the script refuses to run while orders from real customers exist, unless --force.
 * The sample categories and products themselves live in ./seed-data.ts.
 */
import { CATEGORIES, PRODUCTS, type SampleProduct } from "./seed-data";

try {
  process.loadEnvFile(".env.local");
} catch {
  // rely on real environment variables (e.g. when seeding the production DB)
}

type Palette = typeof import("../src/lib/site").PALETTE;

async function main() {
  const { db } = await import("../src/lib/db");
  const s = await import("../src/lib/db/schema");
  const { PALETTE } = await import("../src/lib/site");
  const { auth } = await import("../src/lib/server/auth");
  const { computeTotals } = await import("../src/lib/pricing");
  const { DEMO_EMAILS } = await import("../src/lib/constants");
  const { eq, inArray, sql } = await import("drizzle-orm");

  const color = (key: Palette[number]["key"]) => {
    const p = PALETTE.find((c) => c.key === key)!;
    return { nameVi: p.nameVi, nameEn: p.nameEn, hex: p.hex };
  };

  // deterministic random numbers so every seed produces the same demo data
  let seed = 20261109;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

  const CATALOG = process.argv.includes("--catalog");
  const FORCE = process.argv.includes("--force");
  const adminEmail = (process.env.ADMIN_EMAILS ?? "admin@may.studio").split(",")[0].trim().toLowerCase();

  async function ensureUser(email: string, password: string, name: string) {
    const existing = await db.query.user.findFirst({ where: eq(s.user.email, email) });
    if (existing) return existing.id;
    const res = await auth.api.signUpEmail({ body: { email, password, name } });
    return res.user.id;
  }

  // safety checks, before anything is deleted
  const hosted = !(process.env.DATABASE_URL ?? "file:local.db").startsWith("file:");
  if (hosted && !FORCE) {
    // orders created by this script use example.com addresses or the demo account
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(s.orders)
      .where(sql`${s.orders.email} not like '%@example.com' and ${s.orders.email} <> 'demo@may.studio'`);
    if (Number(n) > 0) {
      throw new Error(`This database has ${n} order(s) from real customers, and seeding deletes every order. Re-run with --force only if you really mean it.`);
    }
  }
  const adminExists = !!(await db.query.user.findFirst({ where: eq(s.user.email, adminEmail), columns: { id: true } }));
  if (CATALOG && !adminExists && (process.env.SEED_ADMIN_PASSWORD ?? "").length < 12) {
    throw new Error(`Set SEED_ADMIN_PASSWORD to a strong password (12+ characters) to create the admin account ${adminEmail}.`);
  }

  console.log(CATALOG ? "→ Clearing demo data (launch mode)…" : "→ Clearing store data…");
  await db.delete(s.orderEvents);
  await db.delete(s.orderItems);
  await db.delete(s.orders);
  await db.delete(s.reviews);
  await db.delete(s.productVariants);
  await db.delete(s.products);
  await db.delete(s.categories);
  await db.delete(s.coupons);
  // launch mode keeps real customers' address books
  if (!CATALOG) await db.delete(s.addresses);

  console.log("→ Categories…");
  const cats = await db.insert(s.categories).values(CATEGORIES).returning();
  const cat = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  /** colours + photos (free Pexels licence) for each colour of a product */
  const look = (...groups: SampleProduct["looks"]) => ({
    colors: groups.map(([key]) => color(key)),
    images: groups.flatMap(([key, ids]) => ids.map((id) => ({ url: `/images/pexels/${id}.jpg`, colorHex: color(key).hex.toLowerCase() }))),
  });

  console.log("→ Products…");
  const productRows: (typeof s.products.$inferInsert)[] = PRODUCTS.map(({ category, looks, ...p }) => ({
    ...p,
    categoryId: cat(category),
    ...look(...looks),
  }));

  // spread creation dates so "newest" sorting is meaningful
  const now = Date.now();
  const DAY = 86_400_000;
  const rows = productRows.map((p, i) => ({
    ...p,
    colors: p.colors!.map((c) => ({ ...c, hex: c.hex.toLowerCase() })),
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(now - (p.isNew ? i : 30 + i * 2) * DAY),
  }));
  const inserted = await db.insert(s.products).values(rows).returning();

  console.log("→ Stock per colour × size…");
  let variantCount = 0;
  for (const p of inserted) {
    const combos = p.colors.flatMap((c) => p.sizes.map((size) => ({ colorHex: c.hex, size })));
    // split the product's stock unevenly across its variants, with a few sold-out sizes
    const weights = combos.map(() => 0.3 + rand());
    const sum = weights.reduce((a, b) => a + b, 0);
    let left = p.stock;
    const values = combos.map((combo, i) => {
      const share = i === combos.length - 1 ? left : Math.min(left, Math.floor((p.stock * weights[i]) / sum));
      left -= share;
      return { ...combo, productId: p.id, stock: share };
    });
    if (p.stock > 20) {
      for (const v of values) if (rand() < 0.1) v.stock = 0;
    }
    await db.insert(s.productVariants).values(values);
    await db.update(s.products).set({ stock: values.reduce((a, v) => a + v.stock, 0) }).where(eq(s.products.id, p.id));
    variantCount += values.length;
  }

  if (CATALOG) {
    console.log("→ Accounts…");
    const adminId = await ensureUser(adminEmail, process.env.SEED_ADMIN_PASSWORD ?? "", "Admin MÂY");
    await db.update(s.user).set({ role: "admin" }).where(eq(s.user.id, adminId));
    // remove the public demo accounts before real customers arrive
    const ids = (await db.select({ id: s.user.id }).from(s.user).where(inArray(s.user.email, DEMO_EMAILS))).map((u) => u.id);
    if (ids.length) {
      await db.delete(s.session).where(inArray(s.session.userId, ids));
      await db.delete(s.account).where(inArray(s.account.userId, ids));
      await db.delete(s.addresses).where(inArray(s.addresses.userId, ids));
      await db.delete(s.user).where(inArray(s.user.id, ids));
    }
    console.log(`✓ Ready to sell: ${cats.length} categories, ${inserted.length} sample products (${variantCount} variants). No orders, reviews or coupons.`);
    console.log(`  Admin: ${adminEmail}${adminExists ? " (existing account, password unchanged)" : " (created with SEED_ADMIN_PASSWORD)"}`);
    if (ids.length) console.log(`  Removed ${ids.length} public demo account(s).`);
    return;
  }

  console.log("→ Coupons…");
  const couponRows = await db
    .insert(s.coupons)
    .values([
      { code: "MAY10", type: "percent", value: 10, maxDiscount: 200_000, minSubtotal: 0, descriptionVi: "Giảm 10% (tối đa 200K) cho mọi đơn", descriptionEn: "10% off every order (up to 200K)" },
      { code: "WELCOME50K", type: "fixed", value: 50_000, minSubtotal: 400_000, usageLimit: 500, descriptionVi: "Giảm 50K cho đơn từ 400K", descriptionEn: "50K off orders from 400K" },
      { code: "FREESHIP", type: "freeship", value: 0, minSubtotal: 0, endsAt: new Date(now + 30 * DAY), descriptionVi: "Miễn phí giao hàng", descriptionEn: "Free shipping" },
      { code: "BLACKFRIDAY", type: "percent", value: 30, maxDiscount: 500_000, minSubtotal: 800_000, usageLimit: 200, startsAt: new Date(now + 14 * DAY), endsAt: new Date(now + 17 * DAY), descriptionVi: "Black Friday: giảm 30% đơn từ 800K", descriptionEn: "Black Friday: 30% off orders from 800K" },
      { code: "SUMMER25", type: "percent", value: 25, maxDiscount: 300_000, minSubtotal: 500_000, endsAt: new Date(now - 40 * DAY), descriptionVi: "Sale hè (đã kết thúc)", descriptionEn: "Summer sale (ended)" },
      { code: "VIP100K", type: "fixed", value: 100_000, minSubtotal: 1_000_000, usageLimit: 50, active: false, descriptionVi: "Ưu đãi khách VIP (tạm tắt)", descriptionEn: "VIP perk (paused)" },
    ])
    .returning();
  const rules = new Map(couponRows.map((c) => [c.code, c]));

  console.log("→ Users…");
  const adminId = await ensureUser(adminEmail, process.env.SEED_ADMIN_PASSWORD ?? "admin12345", "Admin MÂY");
  await db.update(s.user).set({ role: "admin" }).where(eq(s.user.id, adminId));
  const demoId = await ensureUser("demo@may.studio", "demo12345", "Nguyễn Minh Anh");
  // public read-only admin account for recruiters / visitors
  const viewerId = await ensureUser("viewer@may.studio", "viewer12345", "Demo Viewer");
  await db.update(s.user).set({ role: "viewer" }).where(eq(s.user.id, viewerId));

  await db.insert(s.addresses).values([
    { userId: demoId, label: "Nhà riêng", fullName: "Nguyễn Minh Anh", phone: "0912345678", address: "12 Nguyễn Thị Minh Khai, Phường Xuân Hòa", city: "TP. Hồ Chí Minh", isDefault: true },
    { userId: demoId, label: "Công ty", fullName: "Nguyễn Minh Anh", phone: "0912345678", address: "Tòa nhà Bitexco, 2 Hải Triều, Phường Sài Gòn", city: "TP. Hồ Chí Minh", isDefault: false },
  ]);

  console.log("→ Orders…");
  const names = ["Trần Thu Hà", "Lê Quốc Bảo", "Phạm Ngọc Lan", "Võ Gia Huy", "Đặng Mai Phương", "Bùi Khánh Linh", "Hoàng Đức Minh", "Ngô Thảo Vy"];
  const cities = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Khánh Hòa"];
  const couponPick = [null, null, null, "MAY10", "FREESHIP", "WELCOME50K"];
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const code = () => `MAY-${Array.from({ length: 8 }, () => ALPHA[Math.floor(rand() * ALPHA.length)]).join("")}`;
  const FLOW = ["pending", "confirmed", "shipping", "delivered"] as const;
  const demoDelivered: { productId: number; colorNameVi: string; size: string }[] = [];
  const used = new Map<string, number>();

  for (let i = 0; i < 72; i++) {
    const daysAgo = Math.floor(Math.pow(rand(), 1.3) * 30);
    const createdAt = new Date(now - daysAgo * DAY - Math.floor(rand() * DAY));
    const itemCount = 1 + Math.floor(rand() * 3);
    const items = Array.from({ length: itemCount }, () => {
      const p = pick(inserted);
      const c = pick(p.colors);
      return {
        productId: p.id, slug: p.slug, nameVi: p.nameVi, nameEn: p.nameEn, kind: p.kind,
        colorNameVi: c.nameVi, colorNameEn: c.nameEn, colorHex: c.hex,
        imageUrl: p.images.find((im) => im.colorHex === c.hex.toLowerCase())?.url ?? p.images[0]?.url ?? null,
        size: pick(p.sizes), price: p.price, quantity: 1 + Math.floor(rand() * 2),
      };
    });
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const shippingMethod = rand() < 0.75 ? "standard" : "express";
    const wanted = pick(couponPick);
    const coupon = wanted ? rules.get(wanted) : null;
    const totals = computeTotals({ subtotal, shippingMethod, coupon: coupon && subtotal >= coupon.minSubtotal ? coupon : null });
    if (totals.couponCode) used.set(totals.couponCode, (used.get(totals.couponCode) ?? 0) + 1);

    const isDemo = i % 9 === 0;
    const status =
      isDemo && i < 40 ? "delivered"
      : daysAgo > 6 ? (rand() < 0.92 ? "delivered" : "cancelled")
      : daysAgo > 2 ? pick(["shipping", "delivered", "confirmed"] as const)
      : pick(["pending", "confirmed", "pending"] as const);
    const r = rand();
    const paymentMethod = r < 0.55 ? "cod" : r < 0.85 ? "bank" : "vnpay";
    // prepaid orders are paid before confirmation; COD is paid on delivery
    const paid = status === "cancelled" ? false : paymentMethod === "cod" ? status === "delivered" : status !== "pending";
    const paymentStatus = status === "cancelled" && paymentMethod !== "cod" && rand() < 0.5 ? "refunded" : paid ? "paid" : "unpaid";

    const [order] = await db
      .insert(s.orders)
      .values({
        code: code(),
        userId: isDemo ? demoId : null,
        customerName: isDemo ? "Nguyễn Minh Anh" : pick(names),
        phone: isDemo ? "0912345678" : `09${Math.floor(10000000 + rand() * 89999999)}`,
        email: isDemo ? "demo@may.studio" : `khach${i}@example.com`,
        address: `${1 + Math.floor(rand() * 300)} Đường số ${1 + Math.floor(rand() * 30)}`,
        city: shippingMethod === "express" ? pick(["TP. Hồ Chí Minh", "Hà Nội"]) : pick(cities),
        shippingMethod,
        paymentMethod,
        paymentStatus,
        paidAt: paymentStatus === "paid" ? new Date(createdAt.getTime() + 20 * 60_000) : null,
        paymentRef: paymentStatus === "paid" && paymentMethod !== "cod" ? `FT${Math.floor(rand() * 1e10)}` : null,
        couponCode: totals.couponCode,
        subtotal: totals.subtotal,
        shippingFee: totals.shippingFee,
        discount: totals.discount,
        total: totals.total,
        status,
        createdAt,
        updatedAt: createdAt,
      })
      .returning();
    await db.insert(s.orderItems).values(items.map((it) => ({ ...it, orderId: order.id })));

    // event log that matches the final status
    const events: (typeof s.orderEvents.$inferInsert)[] = [{ orderId: order.id, type: "created", status: "pending", actor: order.customerName, createdAt }];
    let at = createdAt.getTime();
    const step = () => (at += (4 + rand() * 20) * 3600_000);
    if (paymentMethod !== "cod" && paymentStatus !== "unpaid") {
      events.push({ orderId: order.id, type: "payment", status: "paid", message: paymentMethod === "bank" ? "VietQR" : "VNPay", actor: paymentMethod === "bank" ? "bank-webhook" : "vnpay", createdAt: new Date(at + 20 * 60_000) });
    }
    const reached = status === "cancelled" ? 0 : FLOW.indexOf(status);
    for (let k = 1; k <= reached; k++) {
      events.push({ orderId: order.id, type: "status", status: FLOW[k], actor: k === 1 && paymentMethod !== "cod" ? "system" : "Admin MÂY", createdAt: new Date(step()) });
    }
    if (status === "delivered" && paymentMethod === "cod") {
      events.push({ orderId: order.id, type: "payment", status: "paid", message: "COD", actor: "Admin MÂY", createdAt: new Date(at) });
    }
    if (status === "cancelled") {
      events.push({ orderId: order.id, type: "status", status: "cancelled", message: rand() < 0.5 ? "Customer cancelled" : "Không liên lạc được khách", actor: "Admin MÂY", createdAt: new Date(step()) });
      if (paymentStatus === "refunded") events.push({ orderId: order.id, type: "payment", status: "refunded", actor: "Admin MÂY", createdAt: new Date(at + 3600_000) });
    }
    await db.insert(s.orderEvents).values(events);

    if (isDemo && status === "delivered") for (const it of items) demoDelivered.push({ productId: it.productId, colorNameVi: it.colorNameVi, size: it.size });
  }
  for (const [c, n] of used) await db.update(s.coupons).set({ usedCount: n }).where(eq(s.coupons.code, c));

  console.log("→ Reviews…");
  const reviewers = ["Thu Hà", "Quốc Bảo", "Ngọc Lan", "Gia Huy", "Mai Phương", "Khánh Linh", "Đức Minh", "Thảo Vy", "Hoàng Yến", "Tuấn Kiệt", "Bảo Ngọc", "Minh Châu", "Emily R.", "Daniel K."];
  const praise = [
    "Vải mềm, mặc mát, form đúng như hình. Sẽ mua thêm màu khác.",
    "Đường may chắc chắn, giặt máy vài lần vẫn đẹp. Rất đáng tiền.",
    "Màu ngoài đời còn đẹp hơn trên web. Giao hàng nhanh, đóng gói cẩn thận.",
    "Chất liệu dày dặn nhưng không bí, mặc đi làm cả ngày thoải mái.",
    "Mình cao 1m65, nặng 55kg mặc size M vừa xinh. Shop tư vấn nhiệt tình.",
    "Lần thứ ba mua ở MÂY, chưa lần nào thất vọng.",
    "Beautiful fabric and a really clean cut. Shipping to Da Nang took two days.",
    "Great quality for the price, the colour is exactly as pictured.",
  ];
  const meh = [
    "Áo đẹp nhưng hơi nhăn sau khi giặt, cần là kỹ.",
    "Form hơi rộng so với mình, nên chọn lùi một size.",
    "Màu hơi khác ảnh một chút, chất vải thì ổn.",
  ];
  const bad = ["Giao hàng chậm hơn dự kiến 2 ngày, sản phẩm thì tạm ổn.", "Đường may chỗ tay áo hơi lỗi, shop đã hỗ trợ đổi."];
  const titles = ["Rất hài lòng", "Đáng mua", "Chất lượng tốt", "Sẽ ủng hộ tiếp", "", "Đẹp như hình", ""];

  let reviewTotal = 0;
  for (const p of inserted) {
    const n = 3 + Math.floor(rand() * 7);
    const rowsForProduct = Array.from({ length: n }, (_, k) => {
      const roll = rand();
      const rating = roll < 0.62 ? 5 : roll < 0.86 ? 4 : roll < 0.95 ? 3 : roll < 0.98 ? 2 : 1;
      const color = pick(p.colors);
      return {
        productId: p.id,
        authorName: reviewers[(p.id * 7 + k * 3) % reviewers.length],
        rating,
        title: rating >= 4 ? pick(titles) : "",
        body: rating >= 4 ? pick(praise) : rating === 3 ? pick(meh) : pick(bad),
        fit: p.sizes[0] === "FREE" ? null : pick(["true", "true", "true", "small", "large"] as const),
        variant: `${color.nameVi} / ${pick(p.sizes)}`,
        verified: rand() < 0.85,
        createdAt: new Date(now - Math.floor(rand() * 90) * DAY - Math.floor(rand() * DAY)),
      };
    });
    await db.insert(s.reviews).values(rowsForProduct);
    reviewTotal += n;
  }

  // the demo customer has reviewed one delivered product; the rest can still be reviewed
  const firstBought = demoDelivered[0];
  if (firstBought) {
    await db.insert(s.reviews).values({
      productId: firstBought.productId,
      userId: demoId,
      authorName: "Nguyễn Minh Anh",
      rating: 5,
      title: "Mặc là mê",
      body: "Chất vải mịn, form chuẩn, giao nhanh trong ngày. Sẽ quay lại mua tiếp!",
      fit: "true",
      variant: `${firstBought.colorNameVi} / ${firstBought.size}`,
      verified: true,
      createdAt: new Date(now - 2 * DAY),
    });
    reviewTotal++;
  }

  // product rating = average of its visible reviews
  for (const p of inserted) {
    const list = await db.select({ rating: s.reviews.rating }).from(s.reviews).where(eq(s.reviews.productId, p.id));
    const avg = list.reduce((a, r) => a + r.rating, 0) / Math.max(1, list.length);
    await db.update(s.products).set({ rating: Math.round(avg * 10) / 10, reviewCount: list.length }).where(eq(s.products.id, p.id));
  }

  console.log(`✓ Seeded ${cats.length} categories, ${inserted.length} products (${variantCount} variants), ${couponRows.length} coupons, 72 orders, ${reviewTotal} reviews.`);
  console.log(`  Admin: ${adminEmail}${adminExists ? " (existing account, password unchanged)" : " / password from SEED_ADMIN_PASSWORD"}`);
  console.log("  Demo customer: demo@may.studio / demo12345");
  console.log("  Read-only admin: viewer@may.studio / viewer12345");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

export {};
