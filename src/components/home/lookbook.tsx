"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import { EDITORIAL } from "@/lib/photos/editorial";

const LINKS = ["/shop?category=vay-dam", "/shop?category=ao-khoac", "/shop?category=quan", "/shop?category=hoodie"];
const TONES = ["#e8dccb", "#d9dccf", "#ead8cf", "#d7d3cb"];

/**
 * Pinned section: vertical scrolling drives a horizontal track of looks.
 * Photos drift against the track for a parallax feel (transform only).
 */
export function Lookbook() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const items = t.raw("lookbookItems") as { title: string; text: string }[];
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);
  const drift = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);

  return (
    <section ref={ref} id="lookbook" className="relative h-[400vh] scroll-mt-0">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div className="container-x flex items-end justify-between pt-28 pb-6">
          <div>
            <p className="text-xs tracking-[0.3em] text-muted uppercase">04 looks · FW26</p>
            <h2 className="font-display text-5xl sm:text-6xl">{t("lookbookTitle")}</h2>
          </div>
          <p className="hidden max-w-xs text-sm text-muted sm:block">{t("lookbookSub")}</p>
        </div>

        <motion.div style={{ x }} className="flex h-full w-[400%] flex-1 pb-8 will-change-transform">
          {EDITORIAL.looks.map((src, i) => (
            <div key={src} className="flex h-full w-1/4 shrink-0 items-stretch px-4 sm:px-6 lg:px-10">
              <article className="relative grid w-full overflow-hidden rounded-[2rem] lg:grid-cols-[1.25fr_1fr]" style={{ background: TONES[i] }}>
                <Link href={LINKS[i]} data-cursor={locale === "vi" ? "Mua" : "Shop"} className="relative block overflow-hidden lg:m-4 lg:rounded-[1.5rem]">
                  <motion.div className="absolute inset-y-0 inset-x-[-8%] will-change-transform" style={{ x: drift }}>
                    <Image src={src} alt={items[i]?.title ?? ""} fill sizes="(min-width: 1024px) 45vw, 92vw" className="object-cover object-[50%_25%]" />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent lg:hidden" />
                </Link>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 text-white lg:pointer-events-auto lg:static lg:justify-end lg:gap-4 lg:p-10 lg:text-[#1c1a17]">
                  <span className="font-display text-6xl leading-none opacity-30 lg:text-8xl">0{i + 1}</span>
                  <h3 className="font-display text-3xl lg:text-5xl">{items[i]?.title}</h3>
                  <p className="max-w-sm text-sm leading-relaxed opacity-80 lg:text-base">{items[i]?.text}</p>
                  <Link
                    href={LINKS[i]}
                    className="pointer-events-auto mt-2 hidden w-fit items-center gap-2 border-b border-current pb-1 text-sm font-medium lg:inline-flex"
                  >
                    {t("shopLook")} <ArrowUpRight size={15} />
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </motion.div>

        <div className="container-x pb-8">
          <div className="h-px w-full bg-border">
            <motion.div className="h-px origin-left bg-foreground" style={{ scaleX: scrollYProgress }} />
          </div>
        </div>
      </div>
    </section>
  );
}
