"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import { cn } from "@/lib/utils";

/** Fullscreen photo viewer: arrows, keyboard (← → Esc), swipe and a thumbnail strip. */
export function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
  alt,
}: {
  photos: string[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  alt: string;
}) {
  const t = useTranslations("Product");
  const lenis = useLenis();
  const open = index !== null;
  const startX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const n = photos.length;
  const go = (d: number) => index !== null && onIndex((index + d + n) % n);

  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, lenis]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[95] flex flex-col bg-[#efe8dd] text-[#1a1714]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <span className="text-sm tabular-nums">
              {index + 1} / {n}
            </span>
            <button ref={closeRef} onClick={onClose} aria-label={t("closeViewer")} className="grid size-11 place-items-center rounded-full bg-white/60 hover:bg-white">
              <X size={20} />
            </button>
          </div>

          <div
            className="relative flex-1 touch-pan-y select-none"
            onPointerDown={(e) => (startX.current = e.clientX)}
            onPointerUp={(e) => {
              if (startX.current === null) return;
              const dx = e.clientX - startX.current;
              startX.current = null;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={photos[index]}
                className="absolute inset-0 bg-[#efe8dd]"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Image src={photos[index]} alt={`${alt} ${index + 1}`} fill sizes="100vw" className="object-contain mix-blend-multiply" priority />
              </motion.div>
            </AnimatePresence>
            {n > 1 ? (
              <>
                <button onClick={() => go(-1)} aria-label={t("prevPhoto")} className="absolute top-1/2 left-3 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/70 hover:bg-white sm:grid">
                  <ChevronLeft size={22} />
                </button>
                <button onClick={() => go(1)} aria-label={t("nextPhoto")} className="absolute top-1/2 right-3 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/70 hover:bg-white sm:grid">
                  <ChevronRight size={22} />
                </button>
              </>
            ) : null}
          </div>

          {n > 1 ? (
            <div className="flex justify-center gap-2 px-4 py-4">
              {photos.map((p, i) => (
                <button
                  key={p}
                  onClick={() => onIndex(i)}
                  aria-label={`${alt} ${i + 1}`}
                  aria-current={i === index}
                  className={cn("relative h-16 w-12 overflow-hidden rounded-lg border-2 bg-[#efe8dd] transition", i === index ? "border-[#1a1714]" : "border-transparent opacity-50 hover:opacity-100")}
                >
                  <Image src={p} alt="" fill sizes="48px" className="object-cover mix-blend-multiply" />
                </button>
              ))}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
