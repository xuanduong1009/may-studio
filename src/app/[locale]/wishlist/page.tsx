"use client";

import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product/product-card";
import { buttonClasses } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/store/wishlist";

export default function WishlistPage() {
  const t = useTranslations("Nav");
  const tc = useTranslations("Cart");
  const mounted = useMounted();
  const items = useWishlist((s) => s.items);

  return (
    <div className="container-x pt-36 pb-12">
      <h1 className="mb-10 flex items-center gap-4 font-display text-5xl sm:text-6xl">
        {t("wishlist")}
        {mounted ? <span className="text-2xl text-muted">({items.length})</span> : null}
      </h1>

      {!mounted ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton aspect-[5/6] rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl bg-subtle px-6 py-24 text-center">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
            <Heart size={44} className="text-accent" />
          </motion.div>
          <Link href="/shop" className={buttonClasses({ className: "mt-8" })}>
            {tc("emptyCta")}
          </Link>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
