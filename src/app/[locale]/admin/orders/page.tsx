import { ChevronRight, Download, Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { ProductImage } from "@/components/product/product-image";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { ORDER_STATUSES } from "@/lib/db/schema";
import { getAdminOrders } from "@/lib/queries";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export default async function AdminOrders({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; payment?: string; q?: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const { status, payment, q } = await searchParams;
  const [t, ts, tt, rows] = await Promise.all([
    getTranslations("Admin"),
    getTranslations("Status"),
    getTranslations("Track"),
    getAdminOrders({ status, payment, q }),
  ]);

  const tabs = [
    { href: "/admin/orders", label: t("allStatuses"), active: !status && !payment },
    { href: "/admin/orders?payment=unpaid", label: t("unpaid"), active: payment === "unpaid" },
    ...ORDER_STATUSES.map((s) => ({ href: `/admin/orders?status=${s}`, label: ts(s), active: status === s })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">{t("orders")}</h1>
        <a
          href={`/api/admin/orders/export${status ? `?status=${status}` : ""}`}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-foreground"
        >
          <Download size={15} /> {t("exportCsv")}
        </a>
      </div>

      <form method="get" className="flex items-center gap-2 rounded-full border border-border bg-card px-4">
        <Search size={16} className="text-muted" />
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <input name="q" defaultValue={q} placeholder={t("searchOrders")} className="h-11 w-full bg-transparent text-sm outline-none" />
      </form>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors",
              tab.active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted">{t("resultCount", { count: rows.length })}</p>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        {rows.length === 0 ? <p className="p-10 text-center text-muted">{t("noData")}</p> : null}
        <ul className="divide-y divide-border">
          {rows.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4 sm:px-5">
              <div className="flex -space-x-3">
                {o.items.slice(0, 3).map((it) => (
                  <div key={it.id} className="h-12 w-10 overflow-hidden rounded-lg border-2 border-card">
                    <ProductImage kind={it.kind} color={it.colorHex} imageUrl={it.imageUrl} alt="" sizes="48px" />
                  </div>
                ))}
              </div>
              <Link href={`/admin/orders/${o.id}`} className="group min-w-40 flex-1">
                <span className="block font-mono text-xs font-semibold group-hover:underline">{o.code}</span>
                <span className="block text-sm">{o.customerName}</span>
                <span className="block text-xs text-muted">{formatDate(o.createdAt, locale, true)}</span>
              </Link>
              <span className="text-xs">
                <span className="block text-muted uppercase">{o.paymentMethod}</span>
                <span className={cn(o.paymentStatus === "paid" ? "text-success" : o.paymentStatus === "refunded" ? "text-muted" : "text-amber-600 dark:text-amber-400")}>
                  {tt(`payment.${o.paymentStatus}`)}
                </span>
              </span>
              <span className="w-28 text-right text-sm font-semibold tabular-nums">{formatPrice(o.total, locale)}</span>
              <OrderStatusSelect orderId={o.id} status={o.status} />
              <Link href={`/admin/orders/${o.id}`} aria-label={o.code} className="grid size-8 place-items-center rounded-full text-muted hover:bg-subtle hover:text-foreground">
                <ChevronRight size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
