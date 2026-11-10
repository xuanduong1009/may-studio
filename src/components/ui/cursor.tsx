"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

const INTERACTIVE = "a, button, [role='button'], select, label, summary";

/**
 * A soft ring that trails the native cursor (which stays visible for
 * usability). It grows over links and buttons, and turns into a labelled disc
 * over elements marked with data-cursor="…" (e.g. product images: "View").
 * Only on devices with a precise pointer and without "reduce motion".
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [hidden, setHidden] = useState(true);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);
    };
    const over = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      const labelled = el?.closest<HTMLElement>("[data-cursor]");
      setLabel(labelled?.dataset.cursor || null);
      setHovering(!!el?.closest(INTERACTIVE));
    };
    const leave = () => setHidden(true);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  if (!enabled) return null;

  const size = label ? 84 : hovering ? 44 : 22;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[200]"
      style={{ x: sx, y: sy }}
      animate={{ opacity: hidden ? 0 : 1 }}
    >
      <motion.div
        className={
          label
            ? "grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg"
            : "-translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/40 backdrop-invert-[0.06]"
        }
        animate={{ width: size, height: size }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <AnimatePresence>
          {label ? (
            <motion.span
              key={label}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-semibold tracking-[0.18em] uppercase"
            >
              {label}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
