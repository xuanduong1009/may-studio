import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeTotals, couponDiscount, evaluateCoupon, expressAvailable, shippingFeeFor, type CouponRule } from "@/lib/pricing";

const MAY10: CouponRule = { code: "MAY10", type: "percent", value: 10, maxDiscount: 200_000, minSubtotal: 0 };
const WELCOME: CouponRule = { code: "WELCOME50K", type: "fixed", value: 50_000, maxDiscount: null, minSubtotal: 400_000 };
const FREESHIP: CouponRule = { code: "FREESHIP", type: "freeship", value: 0, maxDiscount: null, minSubtotal: 0 };

describe("shipping", () => {
  it("is free for standard delivery from 500K", () => {
    assert.equal(shippingFeeFor(499_000, "standard"), 30_000);
    assert.equal(shippingFeeFor(500_000, "standard"), 0);
  });
  it("always charges for express", () => {
    assert.equal(shippingFeeFor(2_000_000, "express"), 50_000);
  });
  it("offers express only in HCMC and Hanoi", () => {
    assert.equal(expressAvailable("TP. Hồ Chí Minh"), true);
    assert.equal(expressAvailable("Hà Nội"), true);
    assert.equal(expressAvailable("Đà Nẵng"), false);
  });
});

describe("coupons", () => {
  it("caps percentage discounts", () => {
    assert.equal(couponDiscount(MAY10, 590_000), 59_000);
    assert.equal(couponDiscount(MAY10, 5_000_000), 200_000);
  });
  it("never discounts more than the subtotal", () => {
    assert.equal(couponDiscount({ ...WELCOME, minSubtotal: 0 }, 30_000), 30_000);
  });
  it("ignores a coupon whose minimum is not met", () => {
    const t = computeTotals({ subtotal: 300_000, shippingMethod: "standard", coupon: WELCOME });
    assert.deepEqual(t, { subtotal: 300_000, shippingFee: 30_000, discount: 0, total: 330_000, couponCode: null });
  });
  it("applies a fixed coupon once the minimum is met", () => {
    const t = computeTotals({ subtotal: 400_000, shippingMethod: "standard", coupon: WELCOME });
    assert.equal(t.discount, 50_000);
    assert.equal(t.total, 380_000);
    assert.equal(t.couponCode, "WELCOME50K");
  });
  it("freeship removes the shipping fee, including express", () => {
    const t = computeTotals({ subtotal: 200_000, shippingMethod: "express", coupon: FREESHIP });
    assert.equal(t.shippingFee, 0);
    assert.equal(t.total, 200_000);
  });
  it("matches the checkout example: 590K linen shirt with MAY10", () => {
    const t = computeTotals({ subtotal: 590_000, shippingMethod: "standard", coupon: MAY10 });
    assert.equal(t.total, 531_000);
  });
});

describe("evaluateCoupon", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  const base = { ...MAY10, active: true, startsAt: null, endsAt: null, usageLimit: null, usedCount: 0 };

  it("accepts a valid coupon", () => {
    const r = evaluateCoupon(base, 100_000, now);
    assert.equal(r.ok, true);
  });
  it("rejects unknown, inactive, early, expired and used-up coupons", () => {
    const reason = (c: Parameters<typeof evaluateCoupon>[0]) => {
      const r = evaluateCoupon(c, 100_000, now);
      return r.ok ? "ok" : r.reason;
    };
    assert.equal(reason(null), "notFound");
    assert.equal(reason({ ...base, active: false }), "inactive");
    assert.equal(reason({ ...base, startsAt: new Date("2026-11-10T00:00:00Z") }), "notStarted");
    assert.equal(reason({ ...base, endsAt: new Date("2026-11-01T00:00:00Z") }), "expired");
    assert.equal(reason({ ...base, usageLimit: 5, usedCount: 5 }), "exhausted");
  });
  it("reports the minimum order amount", () => {
    const r = evaluateCoupon({ ...base, minSubtotal: 400_000 }, 100_000, now);
    assert.deepEqual(r, { ok: false, reason: "minSubtotal", minSubtotal: 400_000 });
  });
});
