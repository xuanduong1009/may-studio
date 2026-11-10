"use client";

import { motion, type HTMLMotionProps } from "motion/react";

/** Fades/slides its children in the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  ...rest
}: { children: React.ReactNode; delay?: number; y?: number; className?: string } & Omit<
  HTMLMotionProps<"div">,
  "children"
>) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Splits a heading into words that rise into place one after another. */
export function RevealText({
  text,
  className,
  delay = 0,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.9, delay: delay + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
