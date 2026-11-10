"use client";

import { Columns2, Columns3, Columns4, X } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useMounted } from "@/hooks/use-mounted";
import { categoryPhoto } from "@/lib/editorial";
import { PALETTE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useFilterNav } from "./shop-filters";

type Category = { slug: string; nameVi: string; nameEn: string; productCount: number };

/** How many columns the shopper prefers on large screens (remembered). */
export const useShopDensity = create<{ cols: 2 | 3 | 4; setCols: (c: 2 | 3 | 4) => void }>()(
  persist((set) => ({ cols: 3, setCols: (cols) => set({ cols }) }), { name: "may-density", storage: createJSONStorage(() => localStorage) }),
);

/** Big tappable category pills with a photo, the fastest way to browse. */
export function CategoryChips({ categories }: { categories: Category[] }) {
  const t = useTranslations("Shop");
  const locale = useLocale();
  const { params, set } = useFilterNav();
  const current = params.get("category");

  return (
    <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1" data-lenis-prevent-wheel>
      <button
        onClick={() => set("category", null)}
        className={cn(
          "flex h-12 shrink-0 items-center rounded-full border px-5 text-sm transition-colors",
          !current ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
        )}
      >
        {t("all")}
      </button>
      {categories.map((c) => {
        const active = current === c.slug;
        return (
          <button
            key={c.slug}
            onClick={() => set("category", active ? null : c.slug)}
            aria-pressed={active}
            className={cn(
              "group flex h-12 shrink-0 items-center gap-2.5 rounded-full border py-1 pr-5 pl-1 text-sm transition-colors",
              active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
            )}
          >
            <span className="relative size-10 overflow-hidden rounded-full bg-subtle">
              <Image src={categoryPhoto(c.slug)} alt="" fill sizes="40px" className="object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-110" />
            </span>
            {locale === "vi" ? c.nameVi : c.nameEn}
            <span className={cn("text-xs", active ? "text-background/60" : "text-muted")}>{c.productCount}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Removable chips for every active filter. */
export function ActiveFilters() {
  const t = useTranslations("Shop");
  const locale = useLocale();
  const { params, set, clear } = useFilterNav();
  const chips: { key: string; label: string }[] = [];
  const color = PALETTE.find((c) => c.key === params.get("color"));
  if (color) chips.push({ key: "color", label: locale === "vi" ? color.nameVi : color.nameEn });
  if (params.get("size")) chips.push({ key: "size", label: `Size ${params.get("size")}` });
  if (params.get("price")) chips.push({ key: "price", label: t(params.get("price") as "under300") });
  if (params.get("sale")) chips.push({ key: "sale", label: t("onSale") });
  if (params.get("instock")) chips.push({ key: "instock", label: t("inStockOnly") });
  if (!chips.length) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <motion.button
          layout
          key={c.key}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => set(c.key, null)}
          className="flex items-center gap-1.5 rounded-full bg-subtle py-1.5 pr-2.5 pl-3.5 text-sm hover:bg-border"
        >
          {c.label} <X size={13} />
        </motion.button>
      ))}
      <button onClick={clear} className="ml-1 text-sm text-muted underline underline-offset-4 hover:text-foreground">
        {t("clear")}
      </button>
    </div>
  );
}

export function DensityToggle() {
  const t = useTranslations("Shop");
  const mounted = useMounted();
  const cols = useShopDensity((s) => s.cols);
  const setCols = useShopDensity((s) => s.setCols);
  const options = [
    { n: 2 as const, icon: Columns2 },
    { n: 3 as const, icon: Columns3 },
    { n: 4 as const, icon: Columns4 },
  ];
  return (
    <div role="group" aria-label={t("density")} className="hidden h-10 items-center rounded-full border border-border p-1 lg:flex">
      {options.map((o) => (
        <button
          key={o.n}
          onClick={() => setCols(o.n)}
          aria-pressed={mounted && cols === o.n}
          aria-label={t("columns", { count: o.n })}
          className={cn("grid size-8 place-items-center rounded-full transition-colors", mounted && cols === o.n ? "bg-foreground text-background" : "text-muted hover:text-foreground")}
        >
          <o.icon size={15} />
        </button>
      ))}
    </div>
  );
}
