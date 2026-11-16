"use client";

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** VI / EN pill; keeps the current page and its filters. */
export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Nav");

  function change(next: "vi" | "en") {
    if (next === locale) return;
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${search}`, { locale: next, scroll: false });
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn("relative mx-1 flex h-8 items-center rounded-full bg-subtle p-0.5 text-[11px] font-semibold", className)}
    >
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => change(l)}
          aria-pressed={locale === l}
          className={cn(
            "relative z-10 h-7 w-9 rounded-full uppercase transition-colors",
            locale === l ? "text-background" : "text-muted hover:text-foreground",
          )}
        >
          {locale === l ? (
            <motion.span
              layoutId="lang-pill"
              className="absolute inset-0 -z-10 rounded-full bg-foreground"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          ) : null}
          {l}
        </button>
      ))}
    </div>
  );
}
