"use client";

import { Loader2, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCoupon, saveCoupon, toggleCoupon, type ActionResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { Coupon } from "@/lib/db/schema";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { CouponInput } from "@/lib/validators";

type Form = {
  code: string;
  type: "percent" | "fixed" | "freeship";
  value: string;
  maxDiscount: string;
  minSubtotal: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  descriptionVi: string;
  descriptionEn: string;
};

const toInput = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "");

function fromCoupon(c?: Coupon): Form {
  return {
    code: c?.code ?? "",
    type: c?.type ?? "percent",
    value: c ? String(c.value) : "10",
    maxDiscount: c?.maxDiscount ? String(c.maxDiscount) : "",
    minSubtotal: c ? String(c.minSubtotal) : "0",
    usageLimit: c?.usageLimit ? String(c.usageLimit) : "",
    startsAt: toInput(c?.startsAt ?? null),
    endsAt: toInput(c?.endsAt ?? null),
    active: c?.active ?? true,
    descriptionVi: c?.descriptionVi ?? "",
    descriptionEn: c?.descriptionEn ?? "",
  };
}

function couponState(c: Coupon, now: number) {
  if (!c.active) return "off" as const;
  if (c.endsAt && c.endsAt.getTime() < now) return "expired" as const;
  if (c.startsAt && c.startsAt.getTime() > now) return "scheduled" as const;
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return "used" as const;
  return "live" as const;
}

const STATE_STYLE = {
  live: "bg-success/15 text-success",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  expired: "bg-subtle text-muted",
  used: "bg-subtle text-muted",
  off: "bg-subtle text-muted",
};

export function CouponManager({ coupons, now }: { coupons: Coupon[]; now: number }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState<{ id: number | null; form: Form } | null>(null);
  const [busy, start] = useTransition();

  function handle(res: ActionResult, ok: string) {
    if (res.ok) {
      toast.success(ok);
      router.refresh();
    } else toast.error(res.error === "readonly" ? t("readonly") : t("invalid"));
  }

  const describe = (c: Coupon) =>
    c.type === "percent"
      ? `−${c.value}%${c.maxDiscount ? ` (≤ ${formatPrice(c.maxDiscount, locale)})` : ""}`
      : c.type === "fixed"
        ? `−${formatPrice(c.value, locale)}`
        : t("couponFreeship");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">{t("coupons")}</h1>
        <Button onClick={() => setEditing({ id: null, form: fromCoupon() })}>
          <Plus size={16} /> {t("newCoupon")}
        </Button>
      </div>

      <AnimatePresence>{editing ? <CouponForm key={editing.id ?? "new"} initial={editing} onClose={() => setEditing(null)} /> : null}</AnimatePresence>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {coupons.map((c) => {
          const state = couponState(c, now);
          const pct = c.usageLimit ? Math.min(100, (c.usedCount / c.usageLimit) * 100) : 0;
          return (
            <motion.div layout key={c.id} className={cn("relative overflow-hidden rounded-3xl border border-border bg-card p-5", state !== "live" && "opacity-70")}>
              {/* ticket notches */}
              <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border border-border bg-background" />
              <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border border-border bg-background" />
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-xl font-bold tracking-wider">{c.code}</p>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", STATE_STYLE[state])}>{t(`couponState.${state}`)}</span>
              </div>
              <p className="mt-1 font-display text-2xl text-accent">{describe(c)}</p>
              <p className="mt-1 text-sm text-muted">{locale === "vi" ? c.descriptionVi : c.descriptionEn}</p>
              <div className="mt-3 space-y-1 border-t border-dashed border-border pt-3 text-xs text-muted">
                {c.minSubtotal ? <p>{t("couponMin", { amount: formatPrice(c.minSubtotal, locale) })}</p> : null}
                {c.endsAt ? <p>{t("couponEnds", { date: formatDate(c.endsAt, locale, true) })}</p> : null}
                <p>
                  {t("couponUsed", { used: c.usedCount })}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </p>
                {c.usageLimit ? (
                  <div className="h-1 overflow-hidden rounded-full bg-subtle">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing({ id: c.id, form: fromCoupon(c) })}>
                  <Pencil size={14} /> {t("edit")}
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => start(async () => handle(await toggleCoupon(c.id, !c.active), t("saved")))}>
                  <Power size={14} /> {c.active ? t("deactivate") : t("activate")}
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} className="ml-auto text-danger hover:bg-danger/10" onClick={() => start(async () => handle(await deleteCoupon(c.id), t("deletedCoupon")))} aria-label={t("delete")}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CouponForm({ initial, onClose }: { initial: { id: number | null; form: Form }; onClose: () => void }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [v, setV] = useState(initial.form);
  const [bad, setBad] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const set = <K extends keyof Form>(k: K, value: Form[K]) => setV((p) => ({ ...p, [k]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = (s: string) => (s.trim() === "" ? null : Number(s));
    const input: CouponInput = {
      code: v.code,
      type: v.type,
      value: Number(v.value || 0),
      maxDiscount: num(v.maxDiscount),
      minSubtotal: Number(v.minSubtotal || 0),
      usageLimit: num(v.usageLimit),
      startsAt: v.startsAt ? new Date(v.startsAt) : null,
      endsAt: v.endsAt ? new Date(v.endsAt) : null,
      active: v.active,
      descriptionVi: v.descriptionVi,
      descriptionEn: v.descriptionEn,
    };
    start(async () => {
      const res = await saveCoupon(initial.id, input);
      if (res.ok) {
        toast.success(t("saved"));
        router.refresh();
        onClose();
      } else {
        setBad(res.fields ?? []);
        toast.error(res.error === "readonly" ? t("readonly") : res.error === "conflict" ? t("couponExists") : t("invalid"));
      }
    });
  }

  const input = (k: string) => cn("h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-foreground", bad.includes(k) ? "border-danger" : "border-border");

  return (
    <motion.form onSubmit={submit} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="grid gap-4 rounded-3xl border border-border bg-card p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
        <div className="flex items-center justify-between sm:col-span-2 lg:col-span-4">
          <h2 className="font-display text-2xl">{initial.id ? t("editCoupon") : t("newCoupon")}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-subtle" aria-label={t("cancel")}>
            <X size={16} />
          </button>
        </div>
        <L text={t("couponFields.code")}>
          <input className={cn(input("code"), "font-mono uppercase")} value={v.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} maxLength={20} required />
        </L>
        <L text={t("couponFields.type")}>
          <select className={input("type")} value={v.type} onChange={(e) => set("type", e.target.value as Form["type"])}>
            <option value="percent">{t("couponTypes.percent")}</option>
            <option value="fixed">{t("couponTypes.fixed")}</option>
            <option value="freeship">{t("couponTypes.freeship")}</option>
          </select>
        </L>
        {v.type !== "freeship" ? (
          <L text={v.type === "percent" ? t("couponFields.percent") : t("couponFields.amount")}>
            <input className={input("value")} type="number" min={0} value={v.value} onChange={(e) => set("value", e.target.value)} required />
          </L>
        ) : null}
        {v.type === "percent" ? (
          <L text={t("couponFields.maxDiscount")}>
            <input className={input("maxDiscount")} type="number" min={0} step={1000} value={v.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} />
          </L>
        ) : null}
        <L text={t("couponFields.minSubtotal")}>
          <input className={input("minSubtotal")} type="number" min={0} step={1000} value={v.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} />
        </L>
        <L text={t("couponFields.usageLimit")}>
          <input className={input("usageLimit")} type="number" min={1} value={v.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="∞" />
        </L>
        <L text={t("couponFields.startsAt")}>
          <input className={input("startsAt")} type="datetime-local" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        </L>
        <L text={t("couponFields.endsAt")}>
          <input className={input("endsAt")} type="datetime-local" value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </L>
        <L text={t("couponFields.descriptionVi")} className="sm:col-span-2">
          <input className={input("descriptionVi")} value={v.descriptionVi} onChange={(e) => set("descriptionVi", e.target.value)} maxLength={200} />
        </L>
        <L text={t("couponFields.descriptionEn")} className="sm:col-span-2">
          <input className={input("descriptionEn")} value={v.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} maxLength={200} />
        </L>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2 lg:col-span-4">
          <input type="checkbox" checked={v.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-[var(--accent)]" />
          {t("couponFields.active")}
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : null} {t("save")}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
        </div>
      </div>
    </motion.form>
  );
}

function L({ text, children, className }: { text: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block text-sm", className)}>
      <span className="mb-1.5 block text-muted">{text}</span>
      {children}
    </label>
  );
}
