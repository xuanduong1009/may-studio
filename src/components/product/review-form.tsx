"use client";

import { Loader2, Star } from "lucide-react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitReview } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { ReviewFit } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Star rating, title, text and fit; only offered to customers who received the product. */
export function ReviewForm({ productId, onDone }: { productId: number; onDone: () => void }) {
  const t = useTranslations("Reviews");
  const locale = useLocale();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fit, setFit] = useState<ReviewFit | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return toast.error(t("pickRating"));
    if (body.trim().length < 10) return toast.error(t("bodyTooShort"));
    start(async () => {
      const res = await submitReview({ productId, rating, title, body, fit }, locale);
      if (res.ok) {
        toast.success(t("thanks"));
        onDone();
        router.refresh();
      } else {
        toast.error(t(`errors.${res.error}`));
      }
    });
  }

  const labels = [t("stars.1"), t("stars.2"), t("stars.3"), t("stars.4"), t("stars.5")];

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mb-8 space-y-5 rounded-3xl border border-border bg-card p-6">
        <div>
          <p className="mb-2 text-sm text-muted">{t("yourRating")}</p>
          <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button
                type="button"
                key={n}
                whileTap={{ scale: 0.8 }}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                aria-label={labels[n - 1]}
                aria-pressed={rating === n}
              >
                <Star
                  size={30}
                  strokeWidth={1.5}
                  className={cn("transition-colors", (hover || rating) >= n ? "fill-[#d4a24c] text-[#d4a24c]" : "text-border")}
                />
              </motion.button>
            ))}
            <span className="ml-3 text-sm text-muted">{labels[(hover || rating) - 1] ?? ""}</span>
          </div>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder={t("titlePlaceholder")}
          className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-foreground"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={1500}
          placeholder={t("bodyPlaceholder")}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
        />
        <div>
          <p className="mb-2 text-sm text-muted">{t("fitQuestion")}</p>
          <div className="flex flex-wrap gap-2">
            {(["small", "true", "large"] as const).map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setFit(fit === f ? null : f)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  fit === f ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
                )}
              >
                {t(`fit.${f}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : null} {t("submit")}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            {t("cancel")}
          </Button>
        </div>
      </div>
    </motion.form>
  );
}
