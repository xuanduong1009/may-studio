import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountNav } from "@/components/account/account-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { redirect } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Account");
  return { title: t("title"), robots: { index: false } };
}

export default async function AccountLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login?redirect=/account", locale });
  const t = await getTranslations("Account");

  return (
    <div className="container-x max-w-5xl pt-36 pb-12">
      <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-accent font-display text-2xl text-accent-foreground">
            {session.user.name.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-4xl sm:text-5xl">{t("hello", { name: session.user.name })}</h1>
            <p className="mt-1 truncate text-sm text-muted">
              {session.user.email} · {t("memberSince", { date: formatDate(session.user.createdAt, locale) })}
            </p>
          </div>
        </div>
        <SignOutButton />
      </div>
      <AccountNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
