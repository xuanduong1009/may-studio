"use client";

import { ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function Newsletter() {
  const t = useTranslations("Home");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="relative mx-auto max-w-xl">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.p
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-3 rounded-full bg-success/15 px-6 py-4 text-success"
          >
            <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }}>
              <Check size={20} />
            </motion.span>
            {t("newsletterDone")}
          </motion.p>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, y: -10 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (/^\S+@\S+\.\S+$/.test(email)) setDone(true);
            }}
            className="flex items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-6 shadow-sm transition-shadow focus-within:shadow-lg"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletterPlaceholder")}
              aria-label={t("newsletterPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
            <button className="group flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background">
              {t("newsletterCta")}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
