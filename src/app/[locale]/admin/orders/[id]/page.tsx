import { ArrowLeft, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { OrderEventLog, OrderProgress } from "@/components/account/order-timeline";
import { ConfirmPaymentButton, OrderNoteForm, PrintButton } from "@/components/admin/order-actions";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { ProductImage } from "@/components/product/product-image";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { getOrderDetail } from "@/lib/queries";
import { site } from "@/lib/site";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export default async function AdminOrderDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: raw, id } = await params;
  const locale = asLocale(raw);
  setRequestLocale(locale);
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) notFound();
  const order = await getOrderDetail(orderId);
  if (!order) notFound();
  const [t, tc, tt] = await Promise.all([getTranslations("Admin"), getTranslations("Checkout"), getTranslations("Track")]);

  const totals = (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">{tc("subtotal")}</dt>
        <dd className="tabular-nums">{formatPrice(order.subtotal, locale)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">{tc("shipping")}</dt>
        <dd className="tabular-nums">{order.shippingFee ? formatPrice(order.shippingFee, locale) : tc("free")}</dd>
      </div>
      {order.discount ? (
        <div className="flex justify-between text-success">
          <dt>
            {tc("discount")} ({order.couponCode})
          </dt>
          <dd className="tabular-nums">−{formatPrice(order.discount, locale)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
        <dt>{tc("total")}</dt>
        <dd className="tabular-nums">{formatPrice(order.total, locale)}</dd>
      </div>
    </dl>
  );

  return (
    <div className="space-y-6">
      {/* Screen view */}
      <div className="space-y-6 print:hidden">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={14} /> {t("orders")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-3xl font-semibold">{order.code}</h1>
            <p className="text-sm text-muted">{formatDate(order.createdAt, locale, true)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusSelect orderId={order.id} status={order.status} />
            <PrintButton />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <OrderProgress status={order.status} events={order.events} createdAt={order.createdAt} locale={locale} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-3 font-medium">{tt("items")}</h2>
              <ul className="divide-y divide-border">
                {order.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-4 py-3">
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg">
                      <ProductImage kind={it.kind} color={it.colorHex} imageUrl={it.imageUrl} alt="" sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      {it.productId ? (
                        <Link href={`/admin/products/${it.productId}`} className="hover:underline">
                          {locale === "vi" ? it.nameVi : it.nameEn}
                        </Link>
                      ) : (
                        <p>{locale === "vi" ? it.nameVi : it.nameEn}</p>
                      )}
                      <p className="text-xs text-muted">
                        {locale === "vi" ? it.colorNameVi : it.colorNameEn} · {it.size} · {formatPrice(it.price, locale)} × {it.quantity}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums">{formatPrice(it.price * it.quantity, locale)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-border pt-4">{totals}</div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-4 font-medium">{tt("history")}</h2>
              <div className="mb-6">
                <OrderNoteForm orderId={order.id} />
              </div>
              <OrderEventLog events={order.events} locale={locale} showNotes />
            </section>
          </div>

          <div className="space-y-6">
            <section className="space-y-3 rounded-3xl border border-border bg-card p-5 text-sm">
              <h2 className="font-medium">{t("customer")}</h2>
              <p className="flex items-center gap-2">
                <UserRound size={15} className="text-muted" /> {order.customerName}
                {order.user ? <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] text-muted">{t("member")}</span> : null}
              </p>
              <p className="flex items-center gap-2">
                <Phone size={15} className="text-muted" />
                <a href={`tel:${order.phone}`} className="hover:underline">
                  {order.phone}
                </a>
              </p>
              <p className="flex items-center gap-2 break-all">
                <Mail size={15} className="shrink-0 text-muted" />
                <a href={`mailto:${order.email}`} className="hover:underline">
                  {order.email}
                </a>
              </p>
              <p className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-muted" /> {order.address}, {order.city}
              </p>
              {order.note ? <p className="rounded-xl bg-subtle px-3 py-2 italic">“{order.note}”</p> : null}
              <p className="text-xs text-muted">{order.shippingMethod === "express" ? tc("express") : tc("standard")}</p>
            </section>

            <section className="space-y-3 rounded-3xl border border-border bg-card p-5 text-sm">
              <h2 className="font-medium">{tc("payment")}</h2>
              <div className="flex items-center justify-between">
                <span className="text-muted">{tc(order.paymentMethod)}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    order.paymentStatus === "paid" ? "bg-success/15 text-success" : order.paymentStatus === "refunded" ? "bg-subtle text-muted" : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                  )}
                >
                  {tt(`payment.${order.paymentStatus}`)}
                </span>
              </div>
              {order.paidAt ? (
                <p className="text-xs text-muted">
                  {formatDate(order.paidAt, locale, true)}
                  {order.paymentRef ? ` · ${order.paymentRef}` : ""}
                </p>
              ) : null}
              {order.paymentStatus === "unpaid" && order.paymentMethod !== "cod" && order.status !== "cancelled" ? <ConfirmPaymentButton orderId={order.id} /> : null}
            </section>
          </div>
        </div>
      </div>

      {/* Printable invoice */}
      <article className="hidden text-black print:block">
        <div className="flex items-start justify-between border-b border-black/20 pb-6">
          <div>
            <p className="font-display text-3xl italic">{site.name}</p>
            <p className="text-sm">{site.address}</p>
            <p className="text-sm">
              {site.email} · {site.phone}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold">{t("invoice")}</p>
            <p className="font-mono">{order.code}</p>
            <p className="text-sm">{formatDate(order.createdAt, locale, true)}</p>
          </div>
        </div>
        <section className="mt-6 text-sm">
          <p className="font-semibold">{tt("shipTo")}</p>
          <p>{order.customerName}</p>
          <p>
            {order.phone} · {order.email}
          </p>
          <p>
            {order.address}, {order.city}
          </p>
        </section>
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-black/30 text-left">
              <th className="py-2">{t("table.product")}</th>
              <th className="py-2 text-right">{t("table.price")}</th>
              <th className="py-2 text-right">SL</th>
              <th className="py-2 text-right">{tc("total")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-b border-black/10">
                <td className="py-2">
                  {locale === "vi" ? it.nameVi : it.nameEn} ({locale === "vi" ? it.colorNameVi : it.colorNameEn} / {it.size})
                </td>
                <td className="py-2 text-right">{formatPrice(it.price, locale)}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">{formatPrice(it.price * it.quantity, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 ml-auto w-72">{totals}</div>
        <p className="mt-10 text-sm">
          {tc("payment")}: {tc(order.paymentMethod)} — {tt(`payment.${order.paymentStatus}`)}
        </p>
        <p className="mt-10 text-center text-xs">{t("invoiceThanks")}</p>
      </article>
    </div>
  );
}
