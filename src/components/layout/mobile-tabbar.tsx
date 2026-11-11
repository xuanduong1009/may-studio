"use client";

import { Heart, Home, Search, Store, User } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { OPEN_SEARCH } from "@/components/search/command-palette";
import { useMounted } from "@/hooks/use-mounted";
import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/store/wishlist";

/** App-style bottom navigation on phones. */
export function MobileTabBar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const mounted = useMounted();
  const wishCount = useWishlist((s) => s.items.length);
  const { data: session } = useSession();

  const tabs = [
    { href: "/", label: t("home"), icon: Home, active: pathname === "/" },
    { href: "/shop", label: t("shop"), icon: Store, active: pathname.startsWith("/shop") || pathname.startsWith("/product") },
    { href: null, label: t("search"), icon: Search, active: false },
    { href: "/wishlist", label: t("wishlist"), icon: Heart, active: pathname === "/wishlist", badge: mounted ? wishCount : 0 },
    { href: session ? "/account" : "/login", label: session ? t("account") : t("login"), icon: User, active: pathname.startsWith("/account") || pathname === "/login" },
  ];

  return (
    <>
      {/* keeps the footer clear of the bar */}
      <div aria-hidden className="h-[calc(68px+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden print:hidden"
      >
        <ul className="grid grid-cols-5">
          {tabs.map((tab) => {
            const content = (
              <>
                <span className="relative">
                  <tab.icon size={21} strokeWidth={tab.active ? 2.2 : 1.6} />
                  {tab.badge ? (
                    <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                      {tab.badge}
                    </span>
                  ) : null}
                </span>
                <span className="text-[10px]">{tab.label}</span>
                {tab.active ? <motion.span layoutId="tab-dot" className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" /> : null}
              </>
            );
            const cls = cn("relative flex h-[60px] flex-col items-center justify-center gap-1 transition-colors", tab.active ? "text-foreground" : "text-muted");
            return (
              <li key={tab.label}>
                {tab.href ? (
                  <Link href={tab.href} className={cls} aria-current={tab.active ? "page" : undefined}>
                    {content}
                  </Link>
                ) : (
                  <button className={cn(cls, "w-full")} onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH))}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
