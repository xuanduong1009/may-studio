import { PackageSearch, Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StatusBadge } from "@/components/account/status-badge";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import { OrderEventLog, OrderProgress } from "@/components/account/order-timeline";
import { ProductImage } from "@/components/product/product-image";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { canAccessOrder } from "@/lib/orders";
import { getOrderByCode } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Track");
  return { title: t("title"), robots: { index: false } };
}

function normalizeCode(raw: string) {
  const c = raw.trim().toUpperCase().replace(/\s+/g, "");
  return c.startsWith("MAY-") ? c : c.replace(/^MAY/, "MAY-");
}

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string; contact?: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const { code = "", contact = "" } = await searchParams;
  const [t, tc, session] = await Promise.all([getTranslations("Track"), getTranslations("Checkout"), getSession()]);

  const searched = code.trim().length > 0;
  const raw = searched ? await getOrderByCode(normalizeCode(code)) : null;
  const order = raw && canAccessOrder(raw, session?.user.id, contact) ? raw : null;

  return (
    <div className="container-x max-w-4xl pt-36 pb-16">
      <Reveal>
        <h1 className="font-display text-5xl sm:text-6xl">{t("title")}</h1>
        <p className="mt-3 max-w-lg text-muted">{t("subtitle")}</p>
      </Reveal>

      <form method="get" className="mt-8 grid gap-3 rounded-3xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:p-5">
        <label className="block">
          <span className="sr-only">{t("code")}</span>
          <input
            name="code"
            defaultValue={code}
            required
            placeholder={t("codePlaceholder")}
            className="h-12 w-full rounded-xl border border-border bg-background px-4 font-mono uppercase outline-none placeholder:font-sans placeholder:normal-case focus:border-foreground"
          />
        </label>
        <label className="block">
          <span className="sr-only">{t("contact")}</span>
          <input
            name="contact"
            defaultValue={contact}
            placeholder={t("contactPlaceholder")}
            className="h-12 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-foreground"
          />
        </label>
        <button type="submit" className={buttonClasses({ className: "h-12" })}>
          <Search size={16} /> {t("submit")}
        </button>
      </form>

      {searched && !order ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl bg-subtle px-6 py-16 text-center">
          <PackageSearch size={40} className="text-muted" />
          <p className="mt-4 font-medium">{t("notFound")}</p>
          <p className="mt-1 max-w-sm text-sm text-muted">{t("notFoundHint")}</p>
        </div>
      ) : null}

      {order ? (
        <Reveal className="mt-10 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xl font-semibold">{order.code}</p>
                <p className="text-sm text-muted">{formatDate(order.createdAt, locale, true)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    order.paymentStatus === "paid" ? "bg-success/15 text-success" : order.paymentStatus === "refunded" ? "bg-subtle text-muted" : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                  )}
                >
                  {t(`payment.${order.paymentStatus}`)}
                </span>
                <StatusBadge status={order.status} />
              </div>
            </div>

            <div className="mt-8">
              <OrderProgress status={order.status} events={order.events} createdAt={order.createdAt} locale={locale} />
            </div>

            {order.status === "pending" ? (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-subtle px-4 py-3 text-sm">
                <span className="text-muted">{t("cancelHint")}</span>
                <CancelOrderButton code={order.code} contact={contact || undefined} />
              </div>
            ) : null}
            {order.paymentMethod === "bank" && order.paymentStatus === "unpaid" && order.status !== "cancelled" ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm">
                <span>{t("awaitingTransfer")}</span>
                <Link href={`/checkout/success?code=${order.code}`} className="font-medium underline underline-offset-4">
                  {t("payNow")}
                </Link>
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-4 font-display text-2xl">{t("items")}</h2>
              <ul className="divide-y divide-border">
                {order.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-4 py-3">
                    <Link href={`/product/${it.slug}`} className="h-16 w-14 shrink-0 overflow-hidden rounded-lg">
                      <ProductImage kind={it.kind} color={it.colorHex} imageUrl={it.imageUrl} alt="" sizes="64px" />
                    </Link>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{locale === "vi" ? it.nameVi : it.nameEn}</p>
                      <p className="text-xs text-muted">
                        {locale === "vi" ? it.colorNameVi : it.colorNameEn} · {it.size} × {it.quantity}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums">{formatPrice(it.price * it.quantity, locale)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>{tc("shipping")}</dt>
                  <dd>{order.shippingFee ? formatPrice(order.shippingFee, locale) : tc("free")}</dd>
                </div>
                {order.discount ? (
                  <div className="flex justify-between text-success">
                    <dt>
                      {tc("discount")} ({order.couponCode})
                    </dt>
                    <dd>−{formatPrice(order.discount, locale)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between pt-1 text-base font-semibold">
                  <dt>{tc("total")}</dt>
                  <dd>{formatPrice(order.total, locale)}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-card p-5 text-sm">
                <h2 className="mb-3 font-display text-xl">{t("shipTo")}</h2>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-muted">{order.phone}</p>
                <p className="text-muted">
                  {order.address}, {order.city}
                </p>
                <p className="mt-3 text-xs text-muted">
                  {order.shippingMethod === "express" ? tc("express") : tc("standard")} · {tc(order.paymentMethod)}
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-5">
                <h2 className="mb-5 font-display text-xl">{t("history")}</h2>
                <OrderEventLog events={order.events} locale={locale} />
              </div>
            </div>
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}
