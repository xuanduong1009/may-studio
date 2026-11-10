import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { colorStock, stockOf, toStockMap, totalStock } from "@/lib/inventory";
import { canAccessOrder } from "@/lib/order-access";
import { slugify } from "@/lib/utils";
import { checkoutSchema, couponSchema, productSchema, trackSchema } from "@/lib/validators";

describe("inventory", () => {
  const map = toStockMap([
    { colorHex: "#1C1C1C", size: "M", stock: 3 },
    { colorHex: "#1c1c1c", size: "L", stock: 0 },
    { colorHex: "#f5f3ee", size: "M", stock: 7 },
  ]);
  it("looks up stock regardless of hex case", () => {
    assert.equal(stockOf(map, "#1c1c1c", "M"), 3);
    assert.equal(stockOf(map, "#1C1C1C", "L"), 0);
    assert.equal(stockOf(map, "#123456", "M"), 0);
  });
  it("sums per colour and overall", () => {
    assert.equal(colorStock(map, "#1c1c1c", ["S", "M", "L"]), 3);
    assert.equal(totalStock(map), 10);
  });
});

describe("order access", () => {
  const order = { userId: "u1", email: "Minh.Anh@example.com", phone: "0912345678" };
  it("lets the owner in", () => assert.equal(canAccessOrder(order, "u1"), true));
  it("matches email case-insensitively", () => assert.equal(canAccessOrder(order, null, " minh.anh@EXAMPLE.com "), true));
  it("matches phone in local or +84 format", () => {
    assert.equal(canAccessOrder(order, null, "0912 345 678"), true);
    assert.equal(canAccessOrder(order, null, "+84912345678"), true);
  });
  it("refuses everyone else", () => {
    assert.equal(canAccessOrder(order, "u2"), false);
    assert.equal(canAccessOrder(order, null, ""), false);
    assert.equal(canAccessOrder(order, null, "0999999999"), false);
    assert.equal(canAccessOrder(order, null, "345678"), false);
  });
});

describe("validators", () => {
  const valid = {
    name: "Nguyễn Minh Anh",
    phone: "0912345678",
    email: "anh@example.com",
    address: "12 Nguyễn Thị Minh Khai",
    city: "TP. Hồ Chí Minh",
    shippingMethod: "standard",
    paymentMethod: "bank",
  };
  it("accepts Vietnamese mobile numbers", () => {
    for (const phone of ["0912345678", "+84912345678", "0381234567"]) assert.equal(checkoutSchema.safeParse({ ...valid, phone }).success, true, phone);
  });
  it("rejects malformed phones and unknown payment methods", () => {
    assert.equal(checkoutSchema.safeParse({ ...valid, phone: "0212345678" }).success, false);
    assert.equal(checkoutSchema.safeParse({ ...valid, phone: "091234567" }).success, false);
    assert.equal(checkoutSchema.safeParse({ ...valid, paymentMethod: "crypto" }).success, false);
  });
  it("keeps percentage coupons between 1 and 100", () => {
    const coupon = { code: "TEST", type: "percent", value: 120, maxDiscount: null, minSubtotal: 0, usageLimit: null, startsAt: null, endsAt: null, active: true, descriptionVi: "", descriptionEn: "" };
    assert.equal(couponSchema.safeParse(coupon).success, false);
    assert.equal(couponSchema.safeParse({ ...coupon, value: 20 }).success, true);
    assert.equal(couponSchema.safeParse({ ...coupon, code: "bad code!" }).success, false);
  });
  it("rejects stock for a colour the product does not have", () => {
    const product = {
      nameVi: "Áo", nameEn: "Tee", slug: "ao", descriptionVi: "", descriptionEn: "", price: 200_000, compareAtPrice: null,
      categoryId: 1, kind: "tee", colors: [{ nameVi: "Đen", nameEn: "Black", hex: "#1c1c1c" }], sizes: ["M"],
      variants: [{ colorHex: "#1c1c1c", size: "M", stock: 5 }], featured: false, isNew: false, imageUrl: null,
    };
    assert.equal(productSchema.safeParse(product).success, true);
    assert.equal(productSchema.safeParse({ ...product, variants: [{ colorHex: "#ffffff", size: "M", stock: 5 }] }).success, false);
  });
  it("normalises tracking codes", () => {
    const r = trackSchema.safeParse({ code: " may-7kq2x9hd ", contact: "0912345678" });
    assert.equal(r.success && r.data.code, "MAY-7KQ2X9HD");
  });
  it("slugifies Vietnamese", () => {
    assert.equal(slugify("Áo thun cổ tròn – Đen"), "ao-thun-co-tron-den");
  });
});

describe("size finder", async () => {
  const { recommendSize } = await import("@/lib/fit");
  const ALL = ["XS", "S", "M", "L", "XL"];
  it("matches the size guide for typical measurements", () => {
    assert.deepEqual(recommendSize({ height: 165, weight: 58, fit: "regular" }, ALL), { size: "M", exact: true });
    assert.equal(recommendSize({ height: 180, weight: 80, fit: "regular" }, ALL)?.size, "XL");
    assert.equal(recommendSize({ height: 152, weight: 45, fit: "slim" }, ALL)?.size, "XS");
  });
  it("sizes up between sizes unless the shopper prefers a close fit", () => {
    assert.equal(recommendSize({ height: 170, weight: 55, fit: "regular" }, ALL)?.size, "L");
    assert.equal(recommendSize({ height: 170, weight: 55, fit: "slim" }, ALL)?.size, "M");
    assert.equal(recommendSize({ height: 165, weight: 58, fit: "loose" }, ALL)?.size, "L");
  });
  it("falls back to the closest size the product is made in", () => {
    assert.deepEqual(recommendSize({ height: 182, weight: 85, fit: "regular" }, ["XS", "S", "M", "L"]), { size: "L", exact: false });
    assert.deepEqual(recommendSize({ height: 170, weight: 60, fit: "regular" }, ["FREE"]), { size: "FREE", exact: true });
  });
});
