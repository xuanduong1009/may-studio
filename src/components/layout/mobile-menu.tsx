"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";
import { LanguageSwitch } from "./language-switch";
import { NAV } from "./nav";
import { ThemeToggle } from "./theme-toggle";

/** Full-screen menu on phones and tablets, revealed with a circular wipe. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Nav");
  const { data: session } = useSession();

  useScrollLock(open);

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
