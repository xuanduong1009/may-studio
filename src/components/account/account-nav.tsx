"use client";

import { MapPin, Package, Settings } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const t = useTranslations("Account");
  const pathname = usePathname();
  const tabs = [
    { href: "/account", label: t("orders"), icon: Package },
    { href: "/account/addresses", label: t("addresses"), icon: MapPin },
    { href: "/account/settings", label: t("settings"), icon: Settings },
  ];
  return (
    <nav className="no-scrollbar mt-6 flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative isolate flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors",
              active ? "text-background" : "text-muted hover:text-foreground",
            )}
          >
            {active ? <motion.span layoutId="account-tab" className="absolute inset-0 -z-10 rounded-full bg-foreground" transition={{ type: "spring", stiffness: 400, damping: 35 }} /> : null}
            <tab.icon size={15} /> {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
