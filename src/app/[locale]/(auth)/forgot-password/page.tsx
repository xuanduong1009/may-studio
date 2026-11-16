import { getTranslations, setRequestLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/password-reset";
import { asLocale } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return { title: t("forgotTitle"), robots: { index: false } };
}

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale(asLocale((await params).locale));
  return <ForgotPasswordForm />;
}
