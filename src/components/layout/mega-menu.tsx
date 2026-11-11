"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { categoryPhoto } from "@/lib/photos/editorial";
import { cn } from "@/lib/utils";

export type MenuCategory = { slug: string; nameVi: string; nameEn: string; kind: string; color: string; productCount: number };

/** Image-led shop menu: hovering a category previews it on the right. */
export function MegaMenu({ open, categories, onNavigate }: { open: boolean; categories: MenuCategory[]; onNavigate: () => void }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const [hovered, setHovered] = useState(0);
  const current = categories[hovered] ?? categories[0];
  const name = (c: MenuCategory) => (locale === "vi" ? c.nameVi : c.nameEn);

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
          exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 top-full hidden border-b border-border bg-background/95 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:block"
        >
          <div className="container-x grid grid-cols-[1.1fr_0.9fr_1.2fr_1fr] gap-10 py-10">
            <div>
              <p className="mb-4 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">{t("megaCategories")}</p>
              <ul className="space-y-1">
                {categories.map((c, i) => (
                  <li key={c.slug}>
                    <Link
                      href={`/shop?category=${c.slug}`}
                      onPointerEnter={() => setHovered(i)}
                      onFocus={() => setHovered(i)}
                      onClick={onNavigate}
                      className={cn("group flex items-baseline gap-2 py-1 font-display text-2xl transition-colors", i === hovered ? "text-foreground" : "text-muted")}
                    >
                      <span className="transition-transform duration-300 group-hover:translate-x-1.5">{name(c)}</span>
                      <sup className="font-sans text-[10px] text-muted">{c.productCount}</sup>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">{t("megaHighlights")}</p>
              <ul className="space-y-3 text-sm">
                {[
                  { href: "/shop?new=1", label: t("newArrivals") },
                  { href: "/shop?sort=popular", label: t("bestSellers") },
                  { href: "/shop?sale=1", label: t("sale") },
                  { href: "/#look", label: t("lookbook") },
                  { href: "/about", label: t("about") },
                  { href: "/help", label: t("help") },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={onNavigate} className="group inline-flex items-center gap-2 hover:text-accent">
                      {l.label}
                      <ArrowRight size={13} className="-translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Link href={`/shop?category=${current.slug}`} onClick={onNavigate} className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-subtle">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={current.slug}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Image src={categoryPhoto(current.slug)} alt="" fill sizes="360px" className="object-cover object-[50%_22%] transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/50 to-transparent p-5 pt-16 text-white">
                <p className="font-display text-2xl">{name(current)}</p>
                <span className="flex items-center gap-1.5 text-sm">
                  {t("shopNow")} <ArrowRight size={14} />
                </span>
              </div>
            </Link>

            <Link href="/shop?sale=1" onClick={onNavigate} className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-foreground p-6 text-background">
              <div aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full bg-accent/50 blur-3xl transition-transform duration-700 group-hover:scale-150" />
              <p className="relative text-[11px] tracking-[0.25em] text-accent uppercase">Flash sale</p>
              <p className="relative font-display text-4xl leading-tight">
                −30%
                <br />
                <i>{t("megaPromo")}</i>
              </p>
              <span className="relative flex items-center gap-2 text-sm">
                {t("shopNow")} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
