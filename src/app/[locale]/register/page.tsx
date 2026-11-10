import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/routing";
import { AuthForm } from "@/components/auth/auth-form";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Auth");
  return { title: t("register") };
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const { redirect: to } = await searchParams;
  if (await getSession()) redirect({ href: "/account", locale });
  return <AuthForm mode="register" redirectTo={to} />;
}
