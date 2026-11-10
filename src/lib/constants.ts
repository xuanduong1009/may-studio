/** Enum values shared by the database schema, validators and client components. */
export const ORDER_STATUSES = ["pending", "confirmed", "shipping", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["cod", "bank", "vnpay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const COUPON_TYPES = ["percent", "fixed", "freeship"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const REVIEW_FITS = ["small", "true", "large"] as const;
export type ReviewFit = (typeof REVIEW_FITS)[number];

export const ORDER_EVENT_TYPES = ["created", "status", "payment", "note", "email"] as const;

/** Which status changes an admin may make from each status. */
export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};
