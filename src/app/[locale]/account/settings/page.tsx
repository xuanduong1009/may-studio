import { setRequestLocale } from "next-intl/server";
import { AccountSettings } from "@/components/account/account-settings";
import { redirect } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { DEMO_EMAILS } from "@/lib/constants";
import { getSession } from "@/lib/server/session";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login?redirect=/account/settings", locale });
  return <AccountSettings name={session.user.name} isDemo={DEMO_EMAILS.includes(session.user.email)} />;
}
