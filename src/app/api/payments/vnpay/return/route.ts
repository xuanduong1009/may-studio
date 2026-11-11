import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { txnRefToCode, verifyVnpayParams, vnpayConfig } from "@/lib/payments/vnpay";
import { markOrderPaid } from "@/lib/server/orders";
import { site } from "@/lib/site";

/**
 * Where VNPay sends the shopper back. The signed result is verified and, if
 * successful, the order is marked paid here too (the IPN cannot reach a
 * localhost dev server). markOrderPaid is idempotent, so both paths are safe.
 */
export async function GET(req: NextRequest) {
  const config = vnpayConfig();
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  const code = txnRefToCode(query.vnp_TxnRef ?? "");
  const order = code ? await db.query.orders.findFirst({ where: eq(orders.code, code) }) : null;
  if (!config || !order) return NextResponse.redirect(new URL("/", site.url));

  const valid = verifyVnpayParams(query, config.hashSecret);
  const success = valid && query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00" && Number(query.vnp_Amount) === order.total * 100;
  if (success) {
    await markOrderPaid(order.id, { ref: query.vnp_TransactionNo, actor: "vnpay", amount: order.total, method: "VNPay" });
  }
  const prefix = order.locale === "en" ? "/en" : "";
  return NextResponse.redirect(new URL(`${prefix}/checkout/success?code=${order.code}&payment=${success ? "success" : "failed"}`, site.url));
}
