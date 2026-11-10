import { ArrowRight, Package, PenLine } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import { OrderProgress } from "@/components/account/order-timeline";
import { StatusBadge } from "@/components/account/status-badge";
import { ProductImage } from "@/components/product/product-image";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Link, redirect } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatDate, formatPrice } from "@/lib/utils";

export default async function AccountOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login?redirect=/account", locale });

  const [t, tt, orders, myReviews] = await Promise.all([
    getTranslations("Account"),
    getTranslations("Track"),
    db.query.orders.findMany({
      where: (o, { eq }) => eq(o.userId, session.user.id),
      with: { items: true, events: true },
      orderBy: (o, { desc }) => desc(o.createdAt),
    }),
    db.query.reviews.findMany({ where: (r, { eq }) => eq(r.userId, session.user.id), columns: { productId: true } }),
  ]);
  const reviewed = new Set(myReviews.map((r) => r.productId));

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-subtle px-6 py-20 text-center">
        <Package size={40} className="text-muted" />
        <p className="mt-4 text-muted">{t("noOrders")}</p>
        <Link href="/shop" className={buttonClasses({ className: "mt-6" })}>
          {t("startShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {orders.map((order, i) => (
        <Reveal key={order.id} delay={Math.min(i, 5) * 0.06}>
          <article className="rounded-3xl border border-border bg-card p-5 sm:p-7">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold">{order.code}</p>
                <p className="text-xs text-muted">{formatDate(order.createdAt, locale, true)}</p>
              </div>
              <div className="flex items-center gap-2">
                {order.paymentStatus === "paid" ? <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs text-success">{tt("payment.paid")}</span> : null}
                <StatusBadge status={order.status} />
              </div>
            </header>

            <div className="mt-7">
              <OrderProgress status={order.status} events={order.events} createdAt={order.createdAt} locale={locale} />
            </div>

            <ul className="mt-6 space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <Link href={`/product/${item.slug}`} className="h-14 w-12 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage kind={item.kind} color={item.colorHex} imageUrl={item.imageUrl} alt="" sizes="56px" />
                  </Link>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate">{locale === "vi" ? item.nameVi : item.nameEn}</p>
                    <p className="text-xs text-muted">
                      {locale === "vi" ? item.colorNameVi : item.colorNameEn} · {item.size} × {item.quantity}
                    </p>
                  </div>
                  {order.status === "delivered" && item.productId && !reviewed.has(item.productId) ? (
                    <Link href={`/product/${item.slug}#reviews`} className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:border-foreground">
                      <PenLine size={12} /> {t("writeReview")}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>

            <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
              <span>
                <span className="text-muted">{t("total")}: </span>
                <span className="font-semibold">{formatPrice(order.total, locale)}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {order.status === "pending" ? <CancelOrderButton code={order.code} /> : null}
                <Link href={`/track?code=${order.code}`} className="flex items-center gap-1.5 font-medium underline-offset-4 hover:underline">
                  {t("details")} <ArrowRight size={14} />
                </Link>
              </span>
            </footer>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
