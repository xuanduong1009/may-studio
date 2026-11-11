"use client";

import { SearchX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product/product-card";
import { useMounted } from "@/hooks/use-mounted";
import type { ProductCardData } from "@/lib/server/queries/catalog";
import { cn } from "@/lib/utils";
import { useShopDensity } from "@/store/shop-density";
import { useFilterNav } from "./shop-filters";

/** Grid that animates items in/out and re-flows smoothly when filters change. */
export function ProductGrid({ products }: { products: ProductCardData[] }) {
  const t = useTranslations("Shop");
  const { clear, pending } = useFilterNav();
  const mounted = useMounted();
  const density = useShopDensity((s) => s.cols);
  const cols = mounted ? density : 3;

  if (products.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center rounded-3xl bg-subtle px-6 py-24 text-center">
        <SearchX size={40} className="text-muted" />
        <p className="mt-4 font-display text-2xl">{t("noResults")}</p>
        <p className="mt-2 text-muted">{t("noResultsHint")}</p>
        <button onClick={clear} className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm text-background">
          {t("clear")}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-10 transition-opacity sm:gap-x-5",
        cols === 2 ? "lg:grid-cols-2 lg:gap-x-8" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4",
      )}
      style={{ opacity: pending ? 0.55 : 1 }}
    >
      <AnimatePresence mode="popLayout">
        {products.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
