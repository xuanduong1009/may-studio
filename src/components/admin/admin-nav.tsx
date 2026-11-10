"use client";

import { ArrowLeft, LayoutDashboard, MessageSquareText, Package, ReceiptText, TicketPercent, Users } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: t("dashboard"), icon: LayoutDashboard, active: pathname === "/admin" },
    { href: "/admin/products", label: t("products"), icon: Package, active: pathname.startsWith("/admin/products") },
    { href: "/admin/orders", label: t("orders"), icon: ReceiptText, active: pathname.startsWith("/admin/orders") },
    { href: "/admin/coupons", label: t("coupons"), icon: TicketPercent, active: pathname.startsWith("/admin/coupons") },
    { href: "/admin/customers", label: t("customersNav"), icon: Users, active: pathname.startsWith("/admin/customers") },
    { href: "/admin/reviews", label: t("reviews"), icon: MessageSquareText, active: pathname.startsWith("/admin/reviews") },
  ];

  return (
    <nav className="lg:sticky lg:top-28 lg:self-start print:hidden">
      <p className="mb-4 hidden font-display text-2xl lg:block">{t("title")}</p>
      <ul className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={cn(
                "relative isolate flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
                l.active ? "text-background" : "text-muted hover:bg-subtle hover:text-foreground",
              )}
            >
              {l.active ? (
                <motion.span layoutId="admin-nav" className="absolute inset-0 -z-10 rounded-xl bg-foreground" transition={{ type: "spring", stiffness: 400, damping: 35 }} />
              ) : null}
              <l.icon size={17} />
              {l.label}
            </Link>
          </li>
        ))}
        <li className="lg:mt-6">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm whitespace-nowrap text-muted hover:text-foreground">
            <ArrowLeft size={17} /> {t("backToStore")}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
