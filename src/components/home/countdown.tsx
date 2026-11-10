"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { nextSaleEnd } from "@/lib/site";

function Digit({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-background/10 font-display text-4xl tabular-nums backdrop-blur sm:h-20 sm:w-20 sm:text-5xl">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] tracking-[0.2em] uppercase opacity-60">{label}</span>
    </div>
  );
}

export function Countdown() {
  const t = useTranslations("Home");
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = nextSaleEnd().getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const ms = left ?? 0;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms / 3_600_000) % 24);
  const m = Math.floor((ms / 60_000) % 60);
  const s = Math.floor((ms / 1000) % 60);

  return (
    <div className="flex gap-3 sm:gap-4" aria-live="off" style={{ visibility: left === null ? "hidden" : "visible" }}>
      <Digit value={d} label={t("days")} />
      <Digit value={h} label={t("hours")} />
      <Digit value={m} label={t("minutes")} />
      <Digit value={s} label={t("seconds")} />
    </div>
  );
}
