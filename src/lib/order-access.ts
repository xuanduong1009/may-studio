import type { Order } from "@/lib/db/schema";

/** An order is visible to its signed-in owner, or to anyone who knows its email or phone. */
export function canAccessOrder(order: Pick<Order, "userId" | "email" | "phone">, userId?: string | null, contact?: string | null) {
  if (userId && order.userId === userId) return true;
  const c = (contact ?? "").trim().toLowerCase();
  if (!c) return false;
  if (c === order.email.toLowerCase()) return true;
  const digits = c.replace(/\D/g, "").replace(/^84/, "0");
  return digits.length >= 9 && digits === order.phone.replace(/\D/g, "").replace(/^84/, "0");
}
