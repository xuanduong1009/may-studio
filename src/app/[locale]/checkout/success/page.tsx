import { AlertCircle, CheckCircle2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { BankTransfer, VnpayRetry } from "@/components/checkout/bank-transfer";
import { Confetti } from "@/components/checkout/confetti";
import { ProductImage } from "@/components/product/product-image";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { bankConfig, buildVietQrPayload, orderTransferNote } from "@/lib/payments/vietqr";
import { getOrderByCode } from "@/lib/queries";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

/** The address the visitor is actually using (also behind a tunnel or proxy). */
async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return site.url;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto.split(",")[0]}://${host.split(",")[0]}`;
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string; payment?: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const { code, payment } = await searchParams;
  if (!code) notFound();
  const order = await getOrderByCode(code);
  if (!order) notFound();
  const [t, tp] = await Promise.all([getTranslations("Checkout"), getTranslations("Payment")]);
  const firstName = order.customerName.split(" ").slice(-1)[0];
  const vnpayFailed = order.paymentMethod === "vnpay" && order.paymentStatus !== "paid" && payment === "failed";
  const trackHref = `/track?code=${order.code}&contact=${encodeURIComponent(order.email)}`;

  // VietQR: a real, scannable payment QR when the shop's bank account is
  // configured; in demo mode a harmless QR that opens the order page instead.
  let qrSvg = "";
  const bank = bankConfig();
  const note = orderTransferNote(order.code);
  if (order.paymentMethod === "bank") {
    const content = bank
      ? buildVietQrPayload({ bin: bank.bin, accountNumber: bank.accountNumber, amount: order.total, note })
      : `${await requestOrigin()}${locale === "en" ? "/en" : ""}${trackHref}`;
    qrSvg = await QRCode.toString(content, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1c1b19", light: "#ffffff" } });
  }

  return (
    <div className="relative container-x max-w-3xl pt-36 pb-12 text-center">
      {vnpayFailed ? null : <Confetti />}
      <Reveal>
        {vnpayFailed ? (
          <AlertCircle size={64} strokeWidth={1.25} className="mx-auto text-danger" />
        ) : (
          <CheckCircle2 size={64} strokeWidth={1.25} className="mx-auto text-success" />
        )}
        <h1 className="mt-6 font-display text-5xl sm:text-6xl">{vnpayFailed ? tp("failedTitle") : t("successTitle")}</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">{vnpayFailed ? tp("failedText") : t("successText", { name: firstName })}</p>
        <div className="mx-auto mt-8 inline-flex flex-col rounded-2xl border border-dashed border-border px-8 py-4">
          <span className="text-xs tracking-[0.2em] text-muted uppercase">{t("orderCode")}</span>
          <span className="font-mono text-2xl font-semibold tracking-wider">{order.code}</span>
        </div>
        {vnpayFailed ? (
          <div className="mt-6 flex justify-center">
            <VnpayRetry code={order.code} />
          </div>
        ) : null}
        {order.paymentMethod === "vnpay" && order.paymentStatus === "paid" ? (
          <p className="mx-auto mt-4 w-fit rounded-full bg-success/10 px-4 py-1.5 text-sm text-success">{tp("paidVnpay")}</p>
        ) : null}
      </Reveal>

      {order.paymentMethod === "bank" && order.status !== "cancelled" ? (
        <BankTransfer
          code={order.code}
          amount={order.total}
          qrSvg={qrSvg}
          bank={bank ? { bankName: bank.bankName, accountNumber: bank.accountNumber, accountName: bank.accountName } : null}
          note={note}
          initiallyPaid={order.paymentStatus === "paid"}
        />
      ) : null}

      <Reveal delay={0.2} className="mt-12 rounded-3xl border border-border bg-card p-6 text-left">
        <ul className="divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg">
                <ProductImage kind={item.kind} color={item.colorHex} imageUrl={item.imageUrl} alt="" sizes="64px" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{locale === "vi" ? item.nameVi : item.nameEn}</p>
                <p className="text-xs text-muted">
                  {locale === "vi" ? item.colorNameVi : item.colorNameEn} · {item.size} × {item.quantity}
                </p>
              </div>
              <span className="text-sm tabular-nums">{formatPrice(item.price * item.quantity, locale)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>{t("subtotal")}</span>
            <span>{formatPrice(order.subtotal, locale)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{t("shipping")}</span>
            <span>{order.shippingFee ? formatPrice(order.shippingFee, locale) : t("free")}</span>
          </div>
          {order.discount ? (
            <div className="flex justify-between text-success">
              <span>
                {t("discount")} ({order.couponCode})
              </span>
              <span>−{formatPrice(order.discount, locale)}</span>
            </div>
          ) : null}
          <div className="flex justify-between pt-2 text-lg font-semibold">
            <span>{t("total")}</span>
            <span>{formatPrice(order.total, locale)}</span>
          </div>
        </div>
      </Reveal>

      <p className="mt-6 text-sm text-muted">{t("emailSent", { email: order.email })}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={trackHref} className={buttonClasses()}>
          {t("trackOrder")}
        </Link>
        <Link href="/" className={buttonClasses({ variant: "outline" })}>
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
