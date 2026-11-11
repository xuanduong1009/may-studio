import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { txnRefToCode, verifyVnpayParams, vnpayConfig } from "@/lib/payments/vnpay";
import { logEvent, markOrderPaid } from "@/lib/server/orders";

/**
 * VNPay Instant Payment Notification: server-to-server call that confirms a
 * payment. Response codes follow the VNPay spec.
 */
export async function GET(req: NextRequest) {
  const config = vnpayConfig();
  if (!config) return NextResponse.json({ RspCode: "99", Message: "Not configured" });

  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  if (!verifyVnpayParams(query, config.hashSecret)) return NextResponse.json({ RspCode: "97", Message: "Invalid signature" });

  const code = txnRefToCode(query.vnp_TxnRef ?? "");
  const order = code ? await db.query.orders.findFirst({ where: eq(orders.code, code) }) : null;
  if (!order) return NextResponse.json({ RspCode: "01", Message: "Order not found" });
  if (Number(query.vnp_Amount) !== order.total * 100) return NextResponse.json({ RspCode: "04", Message: "Invalid amount" });
  if (order.paymentStatus === "paid") return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" });

  if (query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00") {
    await markOrderPaid(order.id, { ref: query.vnp_TransactionNo, actor: "vnpay", amount: order.total, method: "VNPay" });
  } else {
    await logEvent(db, order.id, "payment", { status: "failed", message: `VNPay ${query.vnp_ResponseCode}`, actor: "vnpay" });
  }
  return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
}
