"use client";

import { Heart, LayoutDashboard, Menu, Search, ShoppingBag, User } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CommandPalette, OPEN_SEARCH } from "@/components/search/command-palette";
import { useMounted } from "@/hooks/use-mounted";
import { Link, usePathname } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { cartCount, useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { LanguageSwitch } from "./language-switch";
import { MegaMenu, type MenuCategory } from "./mega-menu";
import { MobileMenu } from "./mobile-menu";
import { NAV } from "./nav";
import { ThemeToggle } from "./theme-toggle";

export function Header({ categories = [] }: { categories?: MenuCategory[] }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const mounted = useMounted();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);

  const items = useCart((s) => s.items);
  const bump = useCart((s) => s.bump);
  const openCart = useCart((s) => s.open);
  const wishCount = useWishlist((s) => s.items.length);
  const { data: session } = useSession();
  const count = mounted ? cartCount(items) : 0;

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > prev && y > 160 && !searchOpen && !menuOpen);
  });

  // close overlays on navigation
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  // the mobile tab bar asks for the search palette
  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener(OPEN_SEARCH, open);
    return () => window.removeEventListener(OPEN_SEARCH, open);
  }, []);

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !megaOpen;

  return (
    <>
      <motion.header
        onPointerLeave={() => setMegaOpen(false)}
        className="fixed inset-x-0 top-0 z-50"
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="bg-foreground text-background">
          <p className="container-x truncate py-2 text-center text-[11px] tracking-[0.18em] uppercase">{t("announcement")}</p>
        </div>

        <div
          className={cn(
            "border-b transition-[background-color,border-color,backdrop-filter] duration-500",
            transparent ? "border-transparent bg-transparent" : "border-border/70 bg-background/75 backdrop-blur-xl backdrop-saturate-150",
          )}
        >
          <nav className="container-x flex h-16 items-center gap-4 lg:h-[4.5rem]">
            <button
              className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-subtle lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label={t("menu")}
            >
              <Menu size={20} />
            </button>

            <Link href="/" className="group flex items-baseline gap-1.5" aria-label="MÂY Studio">
              <span className="font-display text-2xl font-semibold tracking-[0.18em] lg:text-[1.7rem]">MÂY</span>
              <span className="text-[10px] tracking-[0.3em] text-muted uppercase transition-colors group-hover:text-accent">studio</span>
            </Link>

            <ul className="mx-auto hidden items-center gap-1 lg:flex">
              {NAV.map((item) => {
                const active = (item.href === "/shop" && pathname.startsWith("/shop")) || (item.href === "/about" && pathname === "/about");
                const isShop = item.key === "shop";
                return (
                  <li
                    key={item.key}
                    onPointerEnter={() => setMegaOpen(isShop && categories.length > 0)}
                    onFocus={() => isShop && setMegaOpen(true)}
                  >
                    <Link
                      href={item.href}
                      aria-expanded={isShop ? megaOpen : undefined}
                      className="group relative px-4 py-2 text-sm font-medium tracking-wide"
                    >
                      {t(item.key)}
                      <span
                        className={cn(
                          "absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-500 ease-out-expo group-hover:scale-x-100",
                          active && "scale-x-100",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
              <IconButton label={t("search")} onClick={() => setSearchOpen((v) => !v)}>
                <Search size={19} />
              </IconButton>
              <LanguageSwitch className="hidden sm:flex" />
              <ThemeToggle className="hidden sm:grid" />
              <IconLink href="/wishlist" label={t("wishlist")} className="hidden sm:grid" badge={mounted ? wishCount : 0}>
                <Heart size={19} />
              </IconLink>
              {session?.user.role === "admin" || session?.user.role === "viewer" ? (
                <IconLink href="/admin" label={t("admin")} className="hidden md:grid">
                  <LayoutDashboard size={19} />
                </IconLink>
              ) : null}
              <IconLink href={session ? "/account" : "/login"} label={session ? t("account") : t("login")}>
                <User size={19} />
              </IconLink>
              <motion.button
                key={bump}
                data-cart-target
                onClick={openCart}
                aria-label={t("cart")}
                className="relative grid size-10 place-items-center rounded-full hover:bg-subtle"
                initial={bump ? { scale: 1 } : false}
                animate={bump ? { scale: [1, 1.35, 0.9, 1.08, 1], rotate: [0, -12, 8, 0] } : undefined}
                transition={{ duration: 0.6, delay: 0.75 }}
              >
                <ShoppingBag size={19} />
                <Badge count={count} />
              </motion.button>
            </div>
          </nav>
        </div>

        <MegaMenu open={megaOpen} categories={categories} onNavigate={() => setMegaOpen(false)} />
      </motion.header>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.span
          key={count}
          initial={{ scale: 0, y: 4 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function IconButton({ label, children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn("relative grid size-10 place-items-center rounded-full transition-colors hover:bg-subtle", className)}
      {...props}
    >
      {children}
    </button>
  );
}

function IconLink({
  href,
  label,
  children,
  className,
  badge,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn("relative grid size-10 place-items-center rounded-full transition-colors hover:bg-subtle", className)}
    >
      {children}
      {badge ? <Badge count={badge} /> : null}
    </Link>
  );
}
