import { AlertTriangle, Banknote, Download, Hourglass, ReceiptText, ShoppingCart, Users } from "lucide-react";
import { asLocale } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StatusBadge } from "@/components/account/status-badge";
import { Bar, CountUp, RevenueChart } from "@/components/admin/charts";
import { LowStock } from "@/components/admin/low-stock";
import { ProductImage } from "@/components/product/product-image";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { ORDER_STATUSES } from "@/lib/db/schema";
import { getDashboardStats, getLowStockVariants } from "@/lib/queries";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [t, stats, lowStock] = await Promise.all([getTranslations("Admin"), getDashboardStats(), getLowStockVariants(8)]);
  const maxStatus = Math.max(...Object.values(stats.statusCounts), 1);
  const maxTop = Math.max(...stats.top.map((p) => p.quantity), 1);

  const kpis = [
    { label: t("revenue"), value: stats.revenue, format: "price" as const, icon: Banknote },
    { label: t("ordersCount"), value: stats.orderCount, format: "number" as const, icon: ShoppingCart },
    { label: t("avgOrder"), value: stats.avgOrder, format: "price" as const, icon: ReceiptText },
    { label: t("customers"), value: stats.customers, format: "number" as const, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">{t("dashboard")}</h1>
        <a href="/api/admin/orders/export" className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-foreground">
          <Download size={15} /> {t("exportCsv")}
        </a>
      </div>

      {stats.awaitingPayment > 0 ? (
        <Link
          href="/admin/orders?payment=unpaid"
          className="flex items-center gap-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 transition-colors hover:bg-amber-500/15 dark:text-amber-200"
        >
          <Hourglass size={16} className="shrink-0" /> {t("awaitingPayment", { count: stats.awaitingPayment })}
          <span className="ml-auto">→</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <Reveal key={k.label} delay={i * 0.06}>
            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-muted">
                <span className="text-xs sm:text-sm">{k.label}</span>
                <k.icon size={18} />
              </div>
              <p className="mt-3 text-xl font-semibold tabular-nums sm:text-2xl">
                <CountUp value={k.value} format={k.format} locale={locale} />
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 className="mb-4 font-medium">{t("revenueChart")}</h2>
          <RevenueChart data={stats.daily} locale={locale} />
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 font-medium">
            <AlertTriangle size={16} className="text-amber-500" /> {t("lowStock")}
          </h2>
          <LowStock rows={lowStock} />
        </section>
      </Reveal>

      <div className="grid gap-6 xl:grid-cols-2">
        <Reveal>
          <section className="h-full rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-5 font-medium">{t("topProducts")}</h2>
            {stats.top.length === 0 ? <p className="text-sm text-muted">{t("noData")}</p> : null}
            <ul className="space-y-4">
              {stats.top.map((p) => (
                <li key={p.slug} className="flex items-center gap-3">
                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage kind={p.kind} color={p.colorHex} imageUrl={p.imageUrl} alt="" sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex justify-between gap-2 text-sm">
                      <Link href={`/product/${p.slug}`} className="truncate hover:underline">
                        {locale === "vi" ? p.nameVi : p.nameEn}
                      </Link>
                      <span className="shrink-0 text-muted tabular-nums">
                        {p.quantity} {t("sold")}
                      </span>
                    </div>
                    <Bar value={p.quantity} max={maxTop} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal delay={0.08}>
          <section className="h-full rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-5 font-medium">{t("statusBreakdown")}</h2>
            <ul className="space-y-4">
              {ORDER_STATUSES.map((s) => (
                <li key={s}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <StatusBadge status={s} />
                    <span className="text-sm tabular-nums">{stats.statusCounts[s]}</span>
                  </div>
                  <Bar value={stats.statusCounts[s]} max={maxStatus} className="h-full rounded-full bg-foreground/70" />
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>

      <Reveal>
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">{t("recentOrders")}</h2>
            <Link href="/admin/orders" className="text-sm text-muted hover:text-foreground">
              →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-2 font-medium">{t("table.code")}</th>
                  <th className="py-2 font-medium">{t("table.customer")}</th>
                  <th className="py-2 font-medium">{t("table.date")}</th>
                  <th className="py-2 font-medium">{t("table.status")}</th>
                  <th className="py-2 text-right font-medium">{t("table.total")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.latest.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 font-mono text-xs">
                      <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                        {o.code}
                      </Link>
                    </td>
                    <td className="py-3">{o.customerName}</td>
                    <td className="py-3 text-muted">{formatDate(o.createdAt, locale, true)}</td>
                    <td className="py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 text-right tabular-nums">{formatPrice(o.total, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
