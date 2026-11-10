"use client";

import { Check, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useLenis } from "lenis/react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ALL_SIZES, PALETTE } from "@/lib/site";
import { cn } from "@/lib/utils";

type Category = { slug: string; nameVi: string; nameEn: string; productCount: number };

export function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function clear() {
    const q = params.get("q");
    startTransition(() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }));
  }

  return { params, set, clear, pending };
}

export function SortSelect() {
  const t = useTranslations("Shop");
  const { params, set } = useFilterNav();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">{t("sortBy")}</span>
      <select
        value={params.get("sort") ?? "newest"}
        onChange={(e) => set("sort", e.target.value === "newest" ? null : e.target.value)}
        className="h-10 cursor-pointer rounded-full border border-border bg-background px-4 pr-8 text-sm outline-none hover:border-foreground"
      >
        <option value="newest">{t("sortNewest")}</option>
        <option value="popular">{t("sortPopular")}</option>
        <option value="price-asc">{t("sortPriceAsc")}</option>
        <option value="price-desc">{t("sortPriceDesc")}</option>
      </select>
    </label>
  );
}

function FilterBody({ categories }: { categories: Category[] }) {
  const t = useTranslations("Shop");
  const locale = useLocale();
  const { params, set, clear } = useFilterNav();
  const active = (k: string, v: string) => params.get(k) === v;

  return (
    <div className="space-y-8">
      <Group title={t("category")}>
        <ul className="space-y-1">
          <li>
            <FilterRow label={t("all")} active={!params.get("category")} onClick={() => set("category", null)} />
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <FilterRow
                label={locale === "vi" ? c.nameVi : c.nameEn}
                count={c.productCount}
                active={active("category", c.slug)}
                onClick={() => set("category", c.slug)}
              />
            </li>
          ))}
        </ul>
      </Group>

      <Group title={t("size")}>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => set("size", s)}
              aria-pressed={active("size", s)}
              className={cn(
                "h-9 min-w-11 rounded-full border px-3 text-xs font-medium transition-all",
                active("size", s) ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t("color")}>
        <div className="grid grid-cols-6 gap-2.5">
          {PALETTE.map((c) => (
            <button
              key={c.key}
              onClick={() => set("color", c.key)}
              aria-pressed={active("color", c.key)}
              aria-label={locale === "vi" ? c.nameVi : c.nameEn}
              title={locale === "vi" ? c.nameVi : c.nameEn}
              className={cn(
                "relative grid aspect-square place-items-center rounded-full border border-foreground/20 transition-transform hover:scale-110",
                active("color", c.key) && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
              style={{ background: c.hex }}
            >
              {active("color", c.key) ? <Check size={14} className={c.key === "white" || c.key === "cream" ? "text-black" : "text-white"} /> : null}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t("price")}>
        <div className="flex flex-col gap-1">
          {(["under300", "300to600", "over600"] as const).map((p) => (
            <FilterRow key={p} label={t(p)} active={active("price", p)} onClick={() => set("price", p)} />
          ))}
        </div>
      </Group>

      <div className="space-y-3">
        <Toggle label={t("onSale")} checked={active("sale", "1")} onChange={() => set("sale", "1")} />
        <Toggle label={t("inStockOnly")} checked={active("instock", "1")} onChange={() => set("instock", "1")} />
      </div>

      <button onClick={clear} className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
        {t("clear")}
      </button>
    </div>
  );
}

/** Desktop: sticky sidebar. */
export function FilterSidebar({ categories }: { categories: Category[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-32">
        <FilterBody categories={categories} />
      </div>
    </aside>
  );
}

/** Mobile: button that opens a draggable bottom sheet. */
export function FilterSheet({ categories, count }: { categories: Category[]; count: number }) {
  const t = useTranslations("Shop");
  const [open, setOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm hover:border-foreground lg:hidden"
      >
        <SlidersHorizontal size={16} /> {t("filters")}
      </button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div
              className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-[2rem] bg-background"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => info.offset.y > 120 && setOpen(false)}
            >
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" />
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="font-display text-2xl">{t("filters")}</h2>
                <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-subtle" aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto px-6 pb-4" data-lenis-prevent>
                <FilterBody categories={categories} />
              </div>
              <div className="border-t border-border p-4">
                <button onClick={() => setOpen(false)} className="h-12 w-full rounded-full bg-foreground text-sm font-medium text-background">
                  {t("showResults", { count })}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-muted uppercase">{title}</p>
      {children}
    </div>
  );
}

function FilterRow({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
        active ? "font-semibold" : "text-muted hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        <span className={cn("h-px bg-foreground transition-all duration-300", active ? "w-4" : "w-0 group-hover:w-2")} />
        {label}
      </span>
      {count !== undefined ? <span className="text-xs text-muted tabular-nums">{count}</span> : null}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} role="switch" aria-checked={checked} className="flex w-full items-center justify-between text-sm">
      {label}
      <span className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-accent" : "bg-border")}>
        <motion.span
          className="absolute top-1 left-1 size-4 rounded-full bg-white shadow"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </span>
    </button>
  );
}
