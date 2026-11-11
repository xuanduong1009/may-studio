import { Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RoleSelect } from "@/components/admin/moderation";
import { asLocale } from "@/i18n/routing";
import { getCustomers } from "@/lib/server/queries/admin";
import { getSession } from "@/lib/server/session";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function AdminCustomers({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const { q } = await searchParams;
  const [t, rows, session] = await Promise.all([getTranslations("Admin"), getCustomers(q), getSession()]);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">{t("customersNav")}</h1>
        <p className="mt-1 text-sm text-muted">{t("customersSummary", { count: rows.length, amount: formatPrice(totalSpent, locale) })}</p>
      </div>

      <form method="get" className="flex items-center gap-2 rounded-full border border-border bg-card px-4">
        <Search size={16} className="text-muted" />
        <input name="q" defaultValue={q} placeholder={t("searchCustomers")} className="h-11 w-full bg-transparent text-sm outline-none" />
      </form>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-5 py-3 font-medium">{t("table.customer")}</th>
              <th className="px-5 py-3 font-medium">{t("joined")}</th>
              <th className="px-5 py-3 text-right font-medium">{t("orders")}</th>
              <th className="px-5 py-3 text-right font-medium">{t("spent")}</th>
              <th className="px-5 py-3 font-medium">{t("lastOrder")}</th>
              <th className="px-5 py-3 font-medium">{t("role")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle font-semibold">{c.name.trim().charAt(0).toUpperCase()}</span>
                    <span className="min-w-0">
                      <span className="block font-medium">{c.name}</span>
                      <span className="block truncate text-xs text-muted">{c.email}</span>
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted">{formatDate(c.createdAt, locale)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{c.orderCount}</td>
                <td className="px-5 py-3 text-right font-medium tabular-nums">{formatPrice(c.spent, locale)}</td>
                <td className="px-5 py-3 text-muted">{c.lastOrder ? formatDate(c.lastOrder, locale) : "—"}</td>
                <td className="px-5 py-3">
                  <RoleSelect userId={c.id} role={c.role} disabled={c.id === session?.user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-10 text-center text-muted">{t("noData")}</p> : null}
      </div>
    </div>
  );
}
