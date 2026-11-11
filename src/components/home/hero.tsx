"use client";

import { ArrowDown, ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useIntroDone } from "@/components/layout/intro";
import { buttonClasses } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { Link } from "@/i18n/navigation";
import { EDITORIAL } from "@/lib/photos/editorial";
import { formatPrice } from "@/lib/utils";
import { CloudCanvas } from "./cloud-canvas";

const ease = [0.16, 1, 0.3, 1] as const;
const curtain = [0.76, 0, 0.24, 1] as const;

function SplitWord({ word, delay, className, ready }: { word: string; delay: number; className?: string; ready: boolean }) {
  return (
    <span className={`-mt-[0.2em] -mr-[0.12em] inline-block overflow-hidden pt-[0.2em] pr-[0.12em] pb-[0.08em] align-bottom ${className ?? ""}`}>
      {Array.from(word).map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block will-change-transform"
          initial={{ y: "115%", rotate: 8 }}
          animate={ready ? { y: 0, rotate: 0 } : undefined}
          transition={{ duration: 1.1, delay: delay + i * 0.045, ease }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

/** The product in the hero photo: a shoppable tag on the picture. */
const TAGGED = { slug: "quan-kaki-dang-dung", nameVi: "Quần kaki dáng đứng", nameEn: "Straight-fit chinos", price: 490_000 };

export function Hero() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const ready = useIntroDone();
  const { scrollY } = useScroll();
  // scroll-linked transforms only (GPU-friendly)
  const textY = useTransform(scrollY, [0, 700], [0, 140]);
  const textOpacity = useTransform(scrollY, [0, 520], [1, 0]);
  const mainY = useTransform(scrollY, [0, 900], [0, -90]);
  const secondY = useTransform(scrollY, [0, 900], [0, -230]);

  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-28 pb-6 lg:pb-20">
      {/* drifting WebGL clouds */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <CloudCanvas />
      </div>

      <div className="container-x grid w-full items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 will-change-transform">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background/50 px-4 py-1.5 text-xs font-medium tracking-[0.15em] uppercase backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            {t("eyebrow")}
          </motion.p>

          <h1 className="font-display text-[clamp(4rem,12.5vw,10.5rem)] leading-[0.88] font-medium tracking-tight">
            <SplitWord word={t("titleA")} delay={0.2} ready={ready} />{" "}
            <SplitWord word={t("titleB")} delay={0.45} ready={ready} className="text-muted italic" />
            <br />
            <SplitWord word={t("titleC")} delay={0.6} ready={ready} className="text-accent italic" />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 1, delay: 1.1, ease }}
            className="mt-8 max-w-md text-lg leading-relaxed text-muted text-balance"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 1, delay: 1.25, ease }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <Link href="/shop" className={buttonClasses({ size: "lg", className: "group" })}>
                {t("ctaShop")}
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/#lookbook" className={buttonClasses({ size: "lg", variant: "outline", className: "bg-background/40 backdrop-blur" })}>
                {t("ctaLookbook")}
              </Link>
            </Magnetic>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1 } : undefined}
            transition={{ duration: 1, delay: 1.5 }}
            className="mt-10 flex items-center gap-3 text-sm text-muted"
          >
            <div className="flex -space-x-2">
              {["#d8a7a1", "#a3b19b", "#22304a", "#cdb48e"].map((c) => (
                <span key={c} className="size-8 rounded-full border-2 border-background" style={{ background: c }} />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 text-foreground">
                <Star size={14} className="fill-[#d4a24c] text-[#d4a24c]" /> <b>4.9</b>
              </div>
              <span>{t("socialProof")}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* editorial photos */}
        <div className="relative mx-auto w-full max-w-[460px] lg:mr-4 lg:max-w-[500px]">
          <motion.div style={{ y: mainY }} className="will-change-transform">
            <motion.div
              className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[2.25rem] bg-[#d8b896] shadow-[0_50px_100px_-40px_rgba(60,40,20,0.55)]"
              initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
              animate={ready ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined}
              transition={{ duration: 1.4, delay: 0.25, ease: curtain }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.25 }}
                animate={ready ? { scale: 1 } : undefined}
                transition={{ duration: 2.4, delay: 0.25, ease }}
              >
                <Image src={EDITORIAL.heroMain} alt={t("heroAlt")} fill priority sizes="(min-width: 1024px) 500px, 90vw" className="object-cover object-[50%_28%]" />
              </motion.div>

              {/* shoppable tag on the trousers */}
              <motion.div
                className="absolute top-[64%] left-[54%]"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={ready ? { opacity: 1, scale: 1 } : undefined}
                transition={{ duration: 0.6, delay: 1.9, ease }}
              >
                <Link
                  href={`/product/${TAGGED.slug}`}
                  className="group flex items-center gap-2.5 rounded-full bg-background/85 py-1.5 pr-2 pl-1.5 text-xs shadow-xl backdrop-blur-md transition-transform hover:scale-105"
                >
                  <span className="relative grid size-6 place-items-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />
                    <span className="relative size-2.5 rounded-full bg-accent" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-medium">{locale === "vi" ? TAGGED.nameVi : TAGGED.nameEn}</span>
                    <span className="block text-muted">{formatPrice(TAGGED.price, locale)}</span>
                  </span>
                  <span className="grid size-7 place-items-center rounded-full bg-foreground text-background transition-transform group-hover:rotate-45">
                    <ArrowUpRight size={13} />
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div style={{ y: secondY }} className="absolute -bottom-10 -left-6 w-[44%] will-change-transform sm:-left-14">
            <motion.div
              className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border-[6px] border-background shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)]"
              initial={{ opacity: 0, y: 60, rotate: -8 }}
              animate={ready ? { opacity: 1, y: 0, rotate: -4 } : undefined}
              transition={{ duration: 1.3, delay: 0.75, ease }}
            >
              <Image src={EDITORIAL.heroSecond} alt="" fill sizes="(min-width: 1024px) 220px, 40vw" className="object-cover object-[50%_20%]" />
            </motion.div>
          </motion.div>

          {/* rotating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={ready ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 1, delay: 1.3, ease }}
            className="absolute -top-2 -right-2 size-28 sm:-right-8 sm:size-32"
          >
            <motion.svg viewBox="0 0 100 100" className="size-full" animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>
              <defs>
                <path id="badge-circle" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
              </defs>
              <circle cx="50" cy="50" r="49" className="fill-foreground" />
              <text className="fill-background text-[9.5px] font-medium tracking-[0.2em] uppercase">
                <textPath href="#badge-circle" textLength="236" lengthAdjust="spacing">
                  New collection · FW 2026 ·
                </textPath>
              </text>
            </motion.svg>
            <span className="absolute inset-0 grid place-items-center font-display text-2xl text-background italic">M</span>
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#manifesto"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : undefined}
        transition={{ delay: 2 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.3em] text-muted uppercase md:flex"
      >
        {t("scroll")}
        <motion.span animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <ArrowDown size={16} />
        </motion.span>
      </motion.a>
    </section>
  );
}
