"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

const COLORS = ["#b65a3c", "#d8a7a1", "#a3b19b", "#9cc3e0", "#cdb48e", "#22304a"];

/** A one-off burst of paper confetti for the order success page. */
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        // deterministic pseudo-random values (stable between renders)
        const r = (n: number) => {
          const x = Math.sin(i * 9301 + n * 49297) * 233280;
          return x - Math.floor(x);
        };
        return {
          x: (r(1) - 0.5) * 900,
          y: -(250 + r(2) * 350),
          fall: 500 + r(3) * 400,
          rotate: r(4) * 720 - 360,
          delay: r(5) * 0.25,
          w: 6 + r(6) * 8,
          h: 10 + r(7) * 10,
          color: COLORS[i % COLORS.length],
          round: r(8) > 0.7,
        };
      }),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-40 z-10 flex justify-center">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ width: p.w, height: p.round ? p.w : p.h, background: p.color, borderRadius: p.round ? "999px" : "2px" }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{ x: p.x, y: [0, p.y, p.y + p.fall], opacity: [1, 1, 0], rotate: p.rotate, scale: 1 }}
          transition={{ duration: 2.6, delay: p.delay, ease: [0.2, 0.7, 0.4, 1], times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}
