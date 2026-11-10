"use client";

import { Heart, LayoutDashboard, Menu, Moon, Search, ShoppingBag, Sun, User, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { CommandPalette } from "@/components/search/command-palette";
import { MegaMenu, type MenuCategory } from "./mega-menu";
import { OPEN_SEARCH } from "./mobile-tabbar";
import { useMounted } from "@/hooks/use-mounted";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { cartCount, useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";

const NAV = [
  { href: "/shop", key: "shop" },
  { href: "/shop?new=1", key: "newArrivals" },
  { href: "/shop?sale=1", key: "sale" },
  { href: "/#look", key: "lookbook" },
  { href: "/about", key: "about" },
] as const;

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
            transparent
              ? "border-transparent bg-transparent"
              : "border-border/70 bg-background/75 backdrop-blur-xl backdrop-saturate-150",
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
              <span className="text-[10px] tracking-[0.3em] text-muted uppercase transition-colors group-hover:text-accent">
                studio
              </span>
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

function IconButton({
  label,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
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

export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Nav");

  function change(next: "vi" | "en") {
    if (next === locale) return;
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${search}`, { locale: next, scroll: false });
  }

  return (
    <div role="group" aria-label={t("language")} className={cn("relative mx-1 flex h-8 items-center rounded-full bg-subtle p-0.5 text-[11px] font-semibold", className)}>
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => change(l)}
          aria-pressed={locale === l}
          className={cn("relative z-10 h-7 w-9 rounded-full uppercase transition-colors", locale === l ? "text-background" : "text-muted hover:text-foreground")}
        >
          {locale === l ? (
            <motion.span layoutId="lang-pill" className="absolute inset-0 -z-10 rounded-full bg-foreground" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
          ) : null}
          {l}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useTranslations("Nav");
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={t("theme")}
      title={t("theme")}
      className={cn("relative size-10 place-items-center overflow-hidden rounded-full hover:bg-subtle", className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "moon" : "sun"}
          initial={{ y: 20, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -20, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="grid place-items-center"
        >
          {dark ? <Moon size={19} /> : <Sun size={19} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Nav");
  const lenis = useLenis();
  const { data: session } = useSession();

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  const links = [
    { href: "/", label: t("home") },
    ...NAV.map((n) => ({ href: n.href, label: t(n.key) })),
    { href: "/wishlist", label: t("wishlist") },
    { href: "/track", label: t("track") },
    { href: "/help", label: t("help") },
    { href: session ? "/account" : "/login", label: session ? t("account") : t("login") },
    ...(session?.user.role === "admin" || session?.user.role === "viewer" ? [{ href: "/admin", label: t("admin") }] : []),
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-background lg:hidden"
          initial={{ clipPath: "circle(0% at 2rem 4.5rem)" }}
          animate={{ clipPath: "circle(150% at 2rem 4.5rem)" }}
          exit={{ clipPath: "circle(0% at 2rem 4.5rem)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="container-x flex h-16 items-center justify-between pt-8">
            <span className="font-display text-2xl font-semibold tracking-[0.18em]">MÂY</span>
            <button onClick={onClose} aria-label={t("close")} className="grid size-10 place-items-center rounded-full hover:bg-subtle">
              <X size={22} />
            </button>
          </div>
          <ul className="container-x mt-10 flex flex-col gap-1">
            {links.map((l, i) => (
              <motion.li
                key={l.href}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={l.href} onClick={onClose} className="block py-2 font-display text-4xl">
                  {l.label}
                </Link>
              </motion.li>
            ))}
          </ul>
          <div className="container-x mt-auto flex items-center gap-3 pb-10">
            <LanguageSwitch />
            <ThemeToggle className="grid" />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
