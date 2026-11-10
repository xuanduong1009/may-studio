import { setRequestLocale } from "next-intl/server";
import { AccountSettings } from "@/components/account/account-settings";
import { redirect } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { getSession } from "@/lib/session";

/** Public demo accounts whose password must stay as documented. */
const DEMO_EMAILS = ["demo@may.studio", "viewer@may.studio"];

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login?redirect=/account/settings", locale });
  return <AccountSettings name={session.user.name} isDemo={DEMO_EMAILS.includes(session.user.email)} />;
}
