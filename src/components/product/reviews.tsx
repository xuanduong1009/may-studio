"use client";

import { BadgeCheck, Loader2, PenLine, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { submitReview } from "@/app/actions/account";
import { Button, buttonClasses } from "@/components/ui/button";
import { Stars } from "@/components/ui/stars";
import { Link, useRouter } from "@/i18n/navigation";
import type { ReviewFit } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

type ReviewItem = {
  id: number;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  fit: ReviewFit | null;
  variant: string | null;
  verified: boolean;
  createdAt: Date;
};

type Props = {
  productId: number;
  slug: string;
  rating: number;
  reviewCount: number;
  data: { list: ReviewItem[]; distribution: { star: number; count: number }[]; fits: Record<ReviewFit, number> };
  eligibility: "signin" | "reviewed" | "notPurchased" | "eligible";
};

const PAGE = 5;

export function ProductReviews({ productId, slug, rating, reviewCount, data, eligibility }: Props) {
  const t = useTranslations("Reviews");
  const locale = useLocale();
  const [filter, setFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [shown, setShown] = useState(PAGE);
  const [formOpen, setFormOpen] = useState(false);

  const list = useMemo(() => {
    const filtered = filter ? data.list.filter((r) => r.rating === filter) : data.list;
    return [...filtered].sort((a, b) =>
      sort === "highest" ? b.rating - a.rating : sort === "lowest" ? a.rating - b.rating : +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [data.list, filter, sort]);

  const total = data.list.length;
  const fitTotal = data.fits.small + data.fits.true + data.fits.large;
  // -1 (runs small) … +1 (runs large)
  const fitScore = fitTotal ? (data.fits.large - data.fits.small) / fitTotal : 0;

  return (
    <section id="reviews" className="mt-28 scroll-mt-28">
      <div className="grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-16">
        {/* Summary */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-4xl">{t("title")}</h2>
          <div className="mt-6 flex items-end gap-4">
            <span className="font-display text-7xl leading-none">{reviewCount ? rating.toFixed(1) : "—"}</span>
            <div className="pb-2">
              <Stars rating={rating} size={18} />
              <p className="mt-1 text-sm text-muted">{t("basedOn", { count: reviewCount })}</p>
            </div>
          </div>

          <ul className="mt-6 space-y-2">
            {data.distribution.map((d, i) => {
              const pct = total ? (d.count / total) * 100 : 0;
              const active = filter === d.star;
              return (
                <li key={d.star}>
                  <button
                    onClick={() => {
                      setFilter(active ? null : d.star);
                      setShown(PAGE);
                    }}
                    disabled={!d.count}
                    aria-pressed={active}
                    className={cn("group flex w-full items-center gap-3 rounded-lg px-1 py-0.5 text-sm transition-opacity disabled:opacity-40", filter && !active && "opacity-50")}
                  >
                    <span className="flex w-8 items-center gap-1 tabular-nums">
                      {d.star} <Star size={12} className="fill-[#d4a24c] text-[#d4a24c]" />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
                      <motion.span
                        className={cn("block h-full rounded-full", active ? "bg-accent" : "bg-foreground group-hover:bg-accent")}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </span>
                    <span className="w-8 text-right text-muted tabular-nums">{d.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {fitTotal ? (
            <div className="mt-8">
              <p className="text-sm font-medium">{t("fitTitle")}</p>
              <div className="relative mt-3 h-1.5 rounded-full bg-subtle">
                <motion.span
                  className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow"
                  initial={{ left: "50%" }}
                  whileInView={{ left: `${50 + fitScore * 45}%` }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>{t("fit.small")}</span>
                <span>{t("fit.true")}</span>
                <span>{t("fit.large")}</span>
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            {eligibility === "eligible" ? (
              <Button onClick={() => setFormOpen((v) => !v)} className="w-full">
                <PenLine size={16} /> {t("write")}
              </Button>
            ) : eligibility === "signin" ? (
              <Link href={`/login?redirect=/product/${slug}`} className={buttonClasses({ variant: "outline", className: "w-full" })}>
                {t("signinToReview")}
              </Link>
            ) : (
              <p className="rounded-2xl bg-subtle px-4 py-3 text-sm text-muted">{eligibility === "reviewed" ? t("alreadyReviewed") : t("onlyBuyers")}</p>
            )}
          </div>
        </div>

        {/* List */}
        <div>
          <AnimatePresence initial={false}>
            {formOpen ? <ReviewForm productId={productId} onDone={() => setFormOpen(false)} /> : null}
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <p className="text-sm text-muted">
              {filter ? t("filtered", { count: list.length, star: filter }) : t("showing", { count: total })}
              {filter ? (
                <button onClick={() => setFilter(null)} className="ml-2 text-foreground underline underline-offset-4">
                  {t("clearFilter")}
                </button>
              ) : null}
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              aria-label={t("sort")}
              className="h-9 rounded-full border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
            >
              <option value="newest">{t("sortNewest")}</option>
              <option value="highest">{t("sortHighest")}</option>
              <option value="lowest">{t("sortLowest")}</option>
            </select>
          </div>

          {list.length === 0 ? <p className="py-16 text-center text-muted">{t("empty")}</p> : null}

          <ul className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {list.slice(0, shown).map((r) => (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="py-6"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="grid size-9 place-items-center rounded-full bg-subtle text-sm font-semibold">{r.authorName.trim().charAt(0).toUpperCase()}</span>
                    <span className="font-medium">{r.authorName}</span>
                    {r.verified ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <BadgeCheck size={14} /> {t("verified")}
                      </span>
                    ) : null}
                    <span className="ml-auto text-xs text-muted">{formatDate(r.createdAt, locale)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Stars rating={r.rating} />
                    {r.title ? <p className="font-medium">{r.title}</p> : null}
                  </div>
                  <p className="mt-2 leading-relaxed text-muted">{r.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {r.variant ? <span className="rounded-full bg-subtle px-2.5 py-1">{t("bought", { variant: r.variant })}</span> : null}
                    {r.fit ? <span className="rounded-full bg-subtle px-2.5 py-1">{t(`fit.${r.fit}`)}</span> : null}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {list.length > shown ? (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
                {t("more", { count: list.length - shown })}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ReviewForm({ productId, onDone }: { productId: number; onDone: () => void }) {
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
                <Star size={30} strokeWidth={1.5} className={cn("transition-colors", (hover || rating) >= n ? "fill-[#d4a24c] text-[#d4a24c]" : "text-border")} />
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
                className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors", fit === f ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground")}
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
