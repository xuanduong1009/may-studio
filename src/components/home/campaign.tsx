"use client";

import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";

type Slide = { src: string; title: string; text: string; href: string; position?: string };

function Panel({ slide, index, total, cta }: { slide: Slide; index: number; total: number; cta: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // as the next panel slides over this one, it recedes and dims (transform + opacity only)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.86]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.55]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div ref={ref} className="sticky top-0 h-[100svh] p-2 sm:p-4">
      <motion.div style={{ scale }} className="relative h-full overflow-hidden rounded-[1.75rem] will-change-transform sm:rounded-[2.25rem]">
        <Image src={slide.src} alt={slide.title} fill sizes="100vw" className="object-cover" style={{ objectPosition: slide.position ?? "50% 50%" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
        <motion.div style={{ opacity: dim }} className="absolute inset-0 bg-black" />
        <motion.div style={{ y: textY }} className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-12 lg:p-16">
          <p className="mb-3 text-xs tracking-[0.3em] uppercase opacity-80">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <h3 className="max-w-4xl font-display text-[clamp(2.8rem,8vw,7.5rem)] leading-[0.95]">{slide.title}</h3>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-md text-base opacity-85 sm:text-lg">{slide.text}</p>
            <Link href={slide.href} className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-black">
              {cta} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** Full-screen campaign images that stack as you scroll. */
export function Campaign({ eyebrow, title, slides, cta }: { eyebrow: string; title: string; slides: Slide[]; cta: string }) {
  return (
    <section className="relative pt-16">
      <div className="container-x mb-8">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-accent uppercase">{eyebrow}</p>
        <h2 className="font-display text-5xl sm:text-7xl">{title}</h2>
      </div>
      {slides.map((s, i) => (
        <Panel key={s.src} slide={s} index={i} total={slides.length} cta={cta} />
      ))}
    </section>
  );
}
