import { Eye } from "lucide-react";
import { asLocale } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { redirect } from "@/i18n/navigation";
import { canViewAdmin, getSession } from "@/lib/session";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) return redirect({ href: "/login?redirect=/admin", locale });
  if (!canViewAdmin(session)) notFound();
  const t = await getTranslations("Admin");

  return (
    <div className="container-x pt-32 pb-12 print:pt-0">
      {session.user.role === "viewer" ? (
        <p className="mb-6 flex items-center gap-2 rounded-2xl bg-amber-500/15 print:hidden px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <Eye size={16} className="shrink-0" /> {t("readonly")}
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] print:block">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
