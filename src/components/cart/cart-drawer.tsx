"use client";

import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { useLenis } from "lenis/react";
import { buttonClasses } from "@/components/ui/button";
import { ProductImage } from "@/components/product/product-image";
import { useMounted } from "@/hooks/use-mounted";
import { Link, usePathname } from "@/i18n/navigation";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { cartCount, cartSubtotal, useCart, type CartItem } from "@/store/cart";

export function CartDrawer() {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const mounted = useMounted();
  const { items, isOpen, close } = useCart();
  const lenis = useLenis();
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) lenis?.stop();
    else lenis?.start();
  }, [isOpen, lenis]);

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

export function CartLine({ item, compact }: { item: CartItem; compact?: boolean }) {
  const t = useTranslations("Cart");
  const locale = useLocale();
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const name = locale === "vi" ? item.nameVi : item.nameEn;
  const colorName = locale === "vi" ? item.color.nameVi : item.color.nameEn;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, x: 60, height: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="flex gap-4 border-b border-border py-5">
        <Link href={`/product/${item.slug}`} className="h-28 w-[5.6rem] shrink-0 overflow-hidden rounded-xl bg-subtle">
          <ProductImage kind={item.kind} color={item.color.hex} imageUrl={item.imageUrl} alt={name} />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/product/${item.slug}`} className="line-clamp-2 font-medium hover:underline">
              {name}
            </Link>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(item.price * item.quantity, locale)}</span>
          </div>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span className="inline-block size-3 rounded-full border border-foreground/20" style={{ background: item.color.hex }} />
            {colorName} · {item.size}
          </p>
          {!compact ? (
            <div className="mt-auto flex items-center justify-between pt-3">
              <div className="flex items-center rounded-full border border-border">
                <button className="grid size-8 place-items-center disabled:opacity-30" onClick={() => setQuantity(item.key, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="-">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                <button className="grid size-8 place-items-center disabled:opacity-30" onClick={() => setQuantity(item.key, item.quantity + 1)} disabled={item.quantity >= item.maxQuantity} aria-label="+">
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={() => remove(item.key)} className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-danger">
                <Trash2 size={14} /> {t("remove")}
              </button>
            </div>
          ) : (
            <p className="mt-auto pt-2 text-xs text-muted">× {item.quantity}</p>
          )}
        </div>
      </div>
    </motion.li>
  );
}
