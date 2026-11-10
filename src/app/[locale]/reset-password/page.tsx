import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/password-reset";
import { asLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return { title: t("resetTitle"), robots: { index: false } };
}

/** Better Auth redirects here with ?token=… (or ?error=INVALID_TOKEN) from the emailed link. */
export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  setRequestLocale(asLocale((await params).locale));
  const { token, error } = await searchParams;
  return <ResetPasswordForm token={token} invalid={!!error} />;
}
