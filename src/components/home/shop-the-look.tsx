"use client";

import { ArrowUpRight, Eye, Plus } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ProductImage } from "@/components/product/product-image";
import { Price } from "@/components/ui/price";
import { Link } from "@/i18n/navigation";
import { useQuickView } from "@/store/quick-view";

export type LookSpot = {
  slug: string;
  nameVi: string;
  nameEn: string;
  price: number;
  compareAtPrice: number | null;
  kind: string;
  color: string;
  image: string | null;
  /** position on the photo, % */
  x: number;
  y: number;
};

export type Look = { photo: string; alt: string; spots: LookSpot[] };

/**
 * Two outfit photos that zoom from a framed card to full screen as you scroll.
 * Once open, hotspots appear on every piece; each opens a product card.
 * Only the solid frame uses clip-path; photos move with transforms.
 */
export function ShopTheLook({ looks }: { looks: Look[] }) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const openQuick = useQuickView((s) => s.open);
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const frame = useTransform(scrollYProgress, [0, 0.38], [1, 0]);
  const clipPath = useTransform(frame, (v) => `inset(${v * 14}% ${v * 18}% ${v * 14}% ${v * 18}% round ${v * 36}px)`);
  const sceneScale = useTransform(scrollYProgress, [0, 0.38], [0.74, 1]);
  const leftX = useTransform(scrollYProgress, [0, 0.38], ["12%", "0%"]);
  const rightX = useTransform(scrollYProgress, [0, 0.38], ["-12%", "0%"]);
  const titleOpacity = useTransform(scrollYProgress, [0.12, 0.3], [1, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.25]);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = v > 0.36;
    setOpen(next);
    if (!next) setActive(null);
  });

  return (
    <section id="look" ref={ref} className="relative h-[260vh] scroll-mt-0">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        <motion.div style={{ clipPath }} className="absolute inset-0 bg-[#d9c4ad] dark:bg-[#2a241d]" />

        <motion.h2
          style={{ opacity: titleOpacity, scale: titleScale }}
          className="pointer-events-none absolute z-20 text-center font-display text-[clamp(3rem,10vw,9rem)] leading-none text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.35)]"
        >
          Shop <i className="text-[#f3c7b2]">the</i> look
        </motion.h2>

        <motion.div style={{ scale: sceneScale }} className="relative flex h-[min(84svh,860px)] items-center justify-center gap-3 px-3 will-change-transform sm:gap-6">
          {looks.map((look, li) => (
            <motion.div
              key={look.photo}
              style={{ x: li === 0 ? leftX : rightX }}
              className={`relative aspect-[2/3] h-full will-change-transform ${li > 0 ? "hidden sm:block" : ""}`}
            >
              <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] shadow-[0_40px_80px_-30px_rgba(60,40,20,0.5)]">
                <Image src={look.photo} alt={look.alt} fill sizes="(min-width: 640px) 40vw, 90vw" className="object-cover" />
              </div>

              <AnimatePresence>
                {open
                  ? look.spots.map((it, i) => {
                      const key = `${li}-${it.slug}`;
                      const name = locale === "vi" ? it.nameVi : it.nameEn;
                      return (
                        <motion.div
                          key={key}
                          className="absolute z-10"
                          style={{ left: `${it.x}%`, top: `${it.y}%` }}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ delay: 0.1 + i * 0.1 + li * 0.15, type: "spring", stiffness: 400, damping: 22 }}
                        >
                          <button
                            onClick={() => setActive(active === key ? null : key)}
                            aria-expanded={active === key}
                            aria-label={name}
                            className="relative grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background text-foreground shadow-lg"
                          >
                            <span className="absolute inset-0 animate-ping rounded-full bg-background/70" />
                            <Plus size={16} className={`relative transition-transform duration-300 ${active === key ? "rotate-45" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {active === key ? (
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                className={`absolute top-6 w-60 rounded-2xl border border-border bg-background/95 p-3 shadow-2xl backdrop-blur ${it.x > 50 ? "right-0" : "left-0"}`}
                              >
                                <div className="flex gap-3">
                                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg">
                                    <ProductImage kind={it.kind} color={it.color} imageUrl={it.image} alt="" sizes="64px" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm leading-snug font-medium">{name}</p>
                                    <Price price={it.price} compareAtPrice={it.compareAtPrice} locale={locale} />
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-1.5">
                                  <button onClick={() => openQuick(it.slug)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground text-xs font-medium text-background">
                                    <Eye size={14} /> {t("quickView")}
                                  </button>
                                  <Link href={`/product/${it.slug}`} aria-label={name} className="grid size-9 place-items-center rounded-full border border-border hover:border-foreground">
                                    <ArrowUpRight size={15} />
                                  </Link>
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  : null}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="pointer-events-none absolute bottom-5 left-1/2 w-[min(92vw,34rem)] -translate-x-1/2 rounded-full bg-background/80 px-6 py-2.5 text-center backdrop-blur"
            >
              <p className="font-display text-xl">{t("lookTitle")}</p>
              <p className="text-xs text-muted">{t("lookHint")}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
