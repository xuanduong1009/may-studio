/**
 * Pricing rules shared by the client (live preview) and the server
 * (authoritative calculation when an order is placed). Pure functions only:
 * coupons are loaded from the database by the caller and passed in.
 */

export const FREE_SHIPPING_THRESHOLD = 500_000;
export const SHIPPING_FEES = { standard: 30_000, express: 50_000 } as const;
export type ShippingMethod = keyof typeof SHIPPING_FEES;

/** Express (2h) delivery is only offered in these cities. */
export const EXPRESS_CITIES = ["TP. Hồ Chí Minh", "Hà Nội"];

export function expressAvailable(city: string) {
  return EXPRESS_CITIES.includes(city);
}

/** The part of a coupon the price calculation needs. */
export type CouponRule = {
  code: string;
  type: "percent" | "fixed" | "freeship";
  value: number;
  maxDiscount: number | null;
  minSubtotal: number;
};

export type CouponCheck =
  | { ok: true; rule: CouponRule }
  | { ok: false; reason: "notFound" | "inactive" | "notStarted" | "expired" | "exhausted" | "minSubtotal" | "rateLimited"; minSubtotal?: number };

/** Validates a stored coupon against the cart (pure, so it is unit-tested). */
export function evaluateCoupon(
  coupon:
    | (CouponRule & { active: boolean; startsAt: Date | null; endsAt: Date | null; usageLimit: number | null; usedCount: number })
    | null
    | undefined,
  subtotal: number,
  now = new Date(),
): CouponCheck {
  if (!coupon) return { ok: false, reason: "notFound" };
  if (!coupon.active) return { ok: false, reason: "inactive" };
  if (coupon.startsAt && now < coupon.startsAt) return { ok: false, reason: "notStarted" };
  if (coupon.endsAt && now > coupon.endsAt) return { ok: false, reason: "expired" };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return { ok: false, reason: "exhausted" };
  if (subtotal < coupon.minSubtotal) return { ok: false, reason: "minSubtotal", minSubtotal: coupon.minSubtotal };
  const { code, type, value, maxDiscount, minSubtotal } = coupon;
  return { ok: true, rule: { code, type, value, maxDiscount, minSubtotal } };
}

export function normalizeCoupon(code?: string | null) {
  return (code ?? "").trim().toUpperCase();
}

export function shippingFeeFor(subtotal: number, method: ShippingMethod) {
  if (method === "standard" && subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FEES[method];
}

/** Discount a coupon gives on a subtotal (0 when the minimum is not met). */
export function couponDiscount(coupon: CouponRule, subtotal: number) {
  if (subtotal < coupon.minSubtotal) return 0;
  if (coupon.type === "percent") {
    const raw = Math.round((subtotal * Math.min(coupon.value, 100)) / 100);
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  }
  if (coupon.type === "fixed") return Math.min(coupon.value, subtotal);
  return 0;
}

export function computeTotals(input: { subtotal: number; shippingMethod: ShippingMethod; coupon?: CouponRule | null }) {
  const { subtotal, shippingMethod } = input;
  const coupon = input.coupon && subtotal >= input.coupon.minSubtotal ? input.coupon : null;

  let shippingFee = shippingFeeFor(subtotal, shippingMethod);
  const discount = coupon ? couponDiscount(coupon, subtotal) : 0;
  if (coupon?.type === "freeship") shippingFee = 0;

  const total = Math.max(0, subtotal - discount + shippingFee);
  return { subtotal, shippingFee, discount, total, couponCode: coupon?.code ?? null };
}

export function discountPercent(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
