/** Customer-facing order reads: order history, tracking and the address book. */
import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses, orders } from "@/lib/db/schema";

/** A signed-in customer's orders, newest first, with their lines and history. */
export async function getOrdersForUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: { items: true, events: true },
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
