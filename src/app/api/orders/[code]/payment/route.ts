import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

/** Polled by the success page while it waits for a bank transfer. Exposes no personal data. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await db.query.orders.findFirst({
    where: eq(orders.code, code.toUpperCase()),
    columns: { paymentStatus: true, status: true, paidAt: true },
  });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}
