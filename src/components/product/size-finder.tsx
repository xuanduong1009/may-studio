"use client";
import { Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { recommendSize, type FitPreference } from "@/lib/fit";
import { cn } from "@/lib/utils";
import { useFitProfile } from "@/store/fit-profile";

/** Modal that turns height, weight and fit preference into a size, live. */
export function SizeFinder({ open, onClose, sizes, onPick }: { open: boolean; onClose: () => void; sizes: string[]; onPick: (size: string) => void }) {
  const t = useTranslations("Fit");
  const saved = useFitProfile((s) => s.profile);
  const save = useFitProfile((s) => s.save);
  const [height, setHeight] = useState(saved?.height ?? 165);
  const [weight, setWeight] = useState(saved?.weight ?? 55);
  const [fit, setFit] = useState<FitPreference>(saved?.fit ?? "regular");

  useScrollLock(open);

  const result = recommendSize({ height, weight, fit }, sizes);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[85] grid place-items-center p-4" onKeyDown={(e) => e.key === "Escape" && onClose()}>
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-2xl"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full hover:bg-subtle" aria-label={t("close")} autoFocus>
              <X size={18} />
            </button>
            <div className="p-6 sm:p-8">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                <Sparkles size={14} /> {t("eyebrow")}
              </p>
              <h2 className="mt-2 font-display text-3xl">{t("title")}</h2>
              <p className="mt-1 text-sm text-muted">{t("intro")}</p>

              <Slider label={t("height")} unit="cm" min={140} max={200} value={height} onChange={setHeight} />
              <Slider label={t("weight")} unit="kg" min={38} max={110} value={weight} onChange={setWeight} />

              <p className="mt-6 mb-2 text-sm text-muted">{t("preference")}</p>
              <div className="grid grid-cols-3 gap-2">
                {(["slim", "regular", "loose"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFit(f)}
                    aria-pressed={fit === f}
                    className={cn("rounded-2xl border px-2 py-3 text-sm transition-colors", fit === f ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground")}
                  >
                    {t(`fits.${f}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 bg-subtle px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs text-muted">{t("result")}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={result?.size ?? "-"}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    className="font-display text-4xl"
                  >
                    {result?.size ?? "—"}
                  </motion.p>
                </AnimatePresence>
                {result && !result.exact ? <p className="text-[11px] text-muted">{t("closest")}</p> : null}
              </div>
              <Button
                disabled={!result}
                onClick={() => {
                  save({ height, weight, fit });
                  if (result) onPick(result.size);
                  onClose();
                }}
              >
                {t("use")}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Slider({ label, unit, min, max, value, onChange }: { label: string; unit: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="mt-6 block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-display text-2xl tabular-nums">
          {value}
          <span className="ml-1 font-sans text-xs text-muted">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--accent)]"
      />
    </label>
  );
}
