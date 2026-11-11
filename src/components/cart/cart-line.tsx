"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { ProductImage } from "@/components/product/product-image";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import { useCart, type CartItem } from "@/store/cart";

/** One cart line with quantity controls (or, compact, just the quantity). Used by the cart drawer and checkout. */
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
