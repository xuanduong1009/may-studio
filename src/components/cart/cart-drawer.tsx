"use client";

import { ShoppingBag, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { buttonClasses } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { Link, usePathname } from "@/i18n/navigation";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { cartCount, cartSubtotal, useCart } from "@/store/cart";
import { CartLine } from "./cart-line";

export function CartDrawer() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const mounted = useMounted();
  const { items, isOpen, close } = useCart();
  const pathname = usePathname();

  useScrollLock(isOpen);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  if (!mounted) return null;

  const subtotal = cartSubtotal(items);
  const left = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <header className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="font-display text-2xl">
                {t("title")} <span className="text-base text-muted">({cartCount(items)})</span>
              </h2>
              <button onClick={close} className="grid size-10 place-items-center rounded-full hover:bg-subtle" aria-label="Close">
                <X size={20} />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
                <motion.div
                  initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.15 }}
                  className="grid size-24 place-items-center rounded-full bg-subtle"
                >
                  <ShoppingBag size={36} className="text-muted" />
                </motion.div>
                <p className="text-muted">{t("empty")}</p>
                <Link href="/shop" className={buttonClasses()} onClick={close}>
                  {t("emptyCta")}
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-border px-6 py-4">
                  <p className="flex items-center gap-2 text-sm">
                    <Truck size={16} className={left === 0 ? "text-success" : "text-muted"} />
                    {left === 0 ? t("freeShipReached") : t("freeShipLeft", { amount: formatPrice(left, locale) })}
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-subtle">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>

                <ul className="flex-1 overflow-y-auto px-6" data-lenis-prevent>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <CartLine key={item.key} item={item} />
                    ))}
                  </AnimatePresence>
                </ul>

                <footer className="space-y-4 border-t border-border px-6 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{t("subtotal")}</span>
                    <motion.span key={subtotal} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-lg font-semibold tabular-nums">
                      {formatPrice(subtotal, locale)}
                    </motion.span>
                  </div>
                  <p className="text-xs text-muted">{t("taxNote")}</p>
                  <Link href="/checkout" onClick={close} className={buttonClasses({ size: "lg", className: "w-full" })}>
                    {t("checkout")}
                  </Link>
                  <button onClick={close} className="w-full text-center text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
                    {t("continue")}
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
