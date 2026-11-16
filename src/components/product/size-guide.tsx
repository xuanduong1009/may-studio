"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { SIZE_GUIDE } from "@/lib/site";

/** Size chart modal: chest, waist and height for each size. */
export function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Product");
  useScrollLock(open);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" onKeyDown={(e) => e.key === "Escape" && onClose()}>
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("sizeGuide")}
            className="relative w-full max-w-lg rounded-3xl bg-background p-6 shadow-2xl sm:p-8"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 grid size-10 place-items-center rounded-full hover:bg-subtle"
              aria-label="Close"
              autoFocus
            >
              <X size={18} />
            </button>
            <h2 className="font-display text-3xl">{t("sizeGuide")}</h2>
            <p className="mt-2 text-sm text-muted">{t("sizeGuideIntro")}</p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="py-2 font-medium">{t("size")}</th>
                    <th className="py-2 font-medium">{t("chest")}</th>
                    <th className="py-2 font-medium">{t("waist")}</th>
                    <th className="py-2 font-medium">{t("height")}</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_GUIDE.map((r, i) => (
                    <motion.tr
                      key={r.size}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="border-b border-border/60"
                    >
                      <td className="py-3 font-semibold">{r.size}</td>
                      <td className="py-3 tabular-nums">{r.chest}</td>
                      <td className="py-3 tabular-nums">{r.waist}</td>
                      <td className="py-3 tabular-nums">{r.height}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
