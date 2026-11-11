"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useSpring, useVelocity, useTransform } from "motion/react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { categoryPhoto } from "@/lib/photos/editorial";

type Category = { id: number; slug: string; nameVi: string; nameEn: string; kind: string; color: string; productCount: number };

/**
 * Big typographic list of categories. On desktop a preview card follows the
 * cursor and leans with its speed; on touch screens each row shows a thumbnail.
 */
export function CategoryList({ categories, title, cta }: { categories: Category[]; title: string; cta: string }) {
  const locale = useLocale();
  const [active, setActive] = useState<Category | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 26 });
  const sy = useSpring(y, { stiffness: 220, damping: 26 });
  const rotate = useTransform(useVelocity(sx), [-1500, 1500], [-14, 14]);

  return (
    <section id="categories" className="container-x scroll-mt-24 py-14 sm:py-20">
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <h2 className="font-display text-3xl sm:text-5xl">{title}</h2>
        <Link href="/shop" className="shrink-0 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
          {cta}
        </Link>
      </div>

      <ul
        className="relative border-t border-border"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - r.left);
          y.set(e.clientY - r.top);
        }}
        onPointerLeave={() => setActive(null)}
      >
        {categories.map((c, i) => (
          <li key={c.id} className="border-b border-border">
            <Link
              href={`/shop?category=${c.slug}`}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(c)}
              data-cursor={locale === "vi" ? "Xem" : "View"}
              className="group flex items-center gap-3 py-3 sm:gap-4 sm:py-7"
            >
              <span className="hidden w-8 text-xs text-muted tabular-nums sm:block">{String(i + 1).padStart(2, "0")}</span>
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg sm:size-14 sm:rounded-xl md:hidden">
                <Image src={categoryPhoto(c.slug)} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1 font-display text-xl leading-snug transition-all duration-500 ease-out-expo group-hover:translate-x-4 group-hover:italic sm:text-4xl md:text-5xl lg:text-6xl">
                {locale === "vi" ? c.nameVi : c.nameEn}
              </span>
              <span className="text-xs text-muted tabular-nums sm:text-sm">{c.productCount}</span>
              <ArrowUpRight className="size-[18px] shrink-0 text-muted transition-all duration-500 group-hover:rotate-45 group-hover:text-accent sm:size-[22px]" />
            </Link>
          </li>
        ))}

        {/* floating preview */}
        <motion.div aria-hidden className="pointer-events-none absolute top-0 left-0 z-10 hidden md:block" style={{ x: sx, y: sy, rotate }}>
          <AnimatePresence>
            {active ? (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.6, clipPath: "inset(50% 50% 50% 50% round 24px)" }}
                animate={{ opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 24px)" }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute -top-40 -left-32 h-80 w-64 overflow-hidden rounded-3xl shadow-2xl"
              >
                <Image src={categoryPhoto(active.slug)} alt="" fill sizes="256px" className="object-cover object-[50%_25%]" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </ul>
    </section>
  );
}
