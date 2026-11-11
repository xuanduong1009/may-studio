import { NextResponse, type NextRequest } from "next/server";
import { getOrdersForExport } from "@/lib/server/queries/admin";
import { canViewAdmin, getSession } from "@/lib/server/session";

function csvCell(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  // quote everything and neutralise spreadsheet formulas (CSV injection)
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Orders as CSV (UTF-8 with BOM so Excel shows Vietnamese correctly). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!canViewAdmin(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const rows = await getOrdersForExport(status);
  const header = ["code", "created_at", "status", "payment_method", "payment_status", "customer", "phone", "email", "address", "city", "items", "subtotal", "shipping", "discount", "coupon", "total"];
  const lines = rows.map((o) =>
    [
      o.code,
      o.createdAt.toISOString(),
      o.status,
      o.paymentMethod,
      o.paymentStatus,
      o.customerName,
      o.phone,
      o.email,
      o.address,
      o.city,
      o.items.map((i) => `${i.nameVi} (${i.colorNameVi}/${i.size}) x${i.quantity}`).join("; "),
      o.subtotal,
      o.shippingFee,
      o.discount,
      o.couponCode ?? "",
      o.total,
    ]
      .map(csvCell)
      .join(","),
  );
  const body = "﻿" + [header.join(","), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
