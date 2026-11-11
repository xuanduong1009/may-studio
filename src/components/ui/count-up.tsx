"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/utils";

/** Number that counts up when it scrolls into view. */
export function CountUp({ value, format = "number", locale }: { value: number; format?: "number" | "price"; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const fmt = (v: number) => (format === "price" ? formatPrice(Math.round(v), locale) : Math.round(v).toLocaleString(locale === "vi" ? "vi-VN" : "en-US"));

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => (node.textContent = fmt(v)) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return <span ref={ref}>{fmt(0)}</span>;
}
