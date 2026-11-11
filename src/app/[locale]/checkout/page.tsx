import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/routing";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { bankTransferEnabled } from "@/lib/payments/vietqr";
import { vnpayConfig } from "@/lib/payments/vnpay";
import { getUserAddresses } from "@/lib/queries";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Checkout");
  return { title: t("title"), robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Checkout");
  const session = await getSession();
  const addresses = session ? await getUserAddresses(session.user.id) : [];

  return (
    <div className="container-x pt-36 pb-12">
      <h1 className="mb-10 font-display text-5xl sm:text-6xl">{t("title")}</h1>
      <CheckoutForm
        signedIn={!!session}
        defaults={{ name: session?.user.name, email: session?.user.email }}
        addresses={addresses.map((a) => ({ id: a.id, label: a.label, fullName: a.fullName, phone: a.phone, address: a.address, city: a.city, isDefault: a.isDefault }))}
        payments={{ vnpay: !!vnpayConfig(), bank: bankTransferEnabled() }}
      />
    </div>
  );
}
