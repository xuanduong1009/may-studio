"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [6, 0]);
  return (
    <motion.span style={{ opacity, y }} className="mr-[0.25em] inline-block">
      {word}
    </motion.span>
  );
}

/** A statement whose words light up one by one as it scrolls through the viewport. */
export function Manifesto({ eyebrow, text, highlight }: { eyebrow: string; text: string; highlight: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");

  return (
    <section id="manifesto" className="container-x scroll-mt-24 py-28 sm:py-40">
      <p className="mb-8 text-xs font-semibold tracking-[0.3em] text-accent uppercase">{eyebrow}</p>
      <div ref={ref} className="max-w-5xl font-display text-[clamp(1.9rem,4.6vw,4rem)] leading-[1.12]">
        {words.map((w, i) => (
          <span key={i} className={highlight.includes(w.replace(/[.,]/g, "")) ? "text-accent italic" : undefined}>
            <Word word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
          </span>
        ))}
      </div>
    </section>
  );
}
