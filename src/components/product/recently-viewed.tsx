"use client";

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Price } from "@/components/ui/price";
import { useMounted } from "@/hooks/use-mounted";
import { Link } from "@/i18n/navigation";
import { useRecentlyViewed } from "@/store/recently-viewed";
import { ProductImage } from "./product-image";

/** Horizontal strip of recently viewed products (stored in the browser). */
export function RecentlyViewed({ excludeId }: { excludeId?: number }) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const mounted = useMounted();
  const items = useRecentlyViewed((s) => s.items).filter((p) => p.id !== excludeId);
  const clear = useRecentlyViewed((s) => s.clear);

  if (!mounted || items.length === 0) return null;

  return (
    <section className="mt-24">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-display text-3xl sm:text-4xl">{t("recentlyViewed")}</h2>
        <button onClick={clear} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
          {t("clearHistory")}
        </button>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {items.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i, 6) * 0.05 }}
            className="w-36 shrink-0 snap-start sm:w-44"
          >
            <Link href={`/product/${p.slug}`} className="group block">
              <div className="aspect-[5/6] overflow-hidden rounded-2xl bg-subtle">
                <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                  <ProductImage kind={p.kind} color={p.color} imageUrl={p.imageUrl} alt={locale === "vi" ? p.nameVi : p.nameEn} />
                </div>
              </div>
              <p className="mt-2 truncate text-sm font-medium">{locale === "vi" ? p.nameVi : p.nameEn}</p>
              <Price price={p.price} compareAtPrice={p.compareAtPrice} locale={locale} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
