import { setRequestLocale } from "next-intl/server";
import { AddressBook } from "@/components/account/address-book";
import { redirect } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { getUserAddresses } from "@/lib/queries";
import { getSession } from "@/lib/session";

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login?redirect=/account/addresses", locale });
  const items = await getUserAddresses(session.user.id);
  return (
    <AddressBook
      items={items.map((a) => ({ id: a.id, label: a.label, fullName: a.fullName, phone: a.phone, address: a.address, city: a.city, isDefault: a.isDefault }))}
    />
  );
}
