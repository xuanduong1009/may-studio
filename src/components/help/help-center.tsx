"use client";

import { ChevronDown, Loader2, Search, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { sendContactMessage, type ContactInput } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { cn, searchText } from "@/lib/utils";

type Group = { title: string; items: { q: string; a: string }[] };

/** Searchable FAQ: matches questions and answers, accent-insensitive. */
export function FaqSearch({ groups }: { groups: Group[] }) {
  const t = useTranslations("Help");
  const [q, setQ] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const needle = searchText(q);

  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          items: needle ? g.items.filter((it) => searchText(`${it.q} ${it.a}`).includes(needle)) : g.items,
        }))
        .filter((g) => g.items.length > 0),
    [groups, needle],
  );

  return (
    <div>
      <label className="relative mx-auto block max-w-2xl">
        <Search size={20} className="absolute top-1/2 left-5 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-16 w-full rounded-full border border-border bg-card pr-6 pl-14 text-lg shadow-sm outline-none focus:border-foreground"
        />
      </label>

      <div className="mt-14 space-y-12">
        {filtered.length === 0 ? <p className="text-center text-muted">{t("noResults")}</p> : null}
        {filtered.map((g) => (
          <section key={g.title} className="grid gap-4 lg:grid-cols-[260px_1fr] lg:gap-12">
            <h2 className="font-display text-3xl">{g.title}</h2>
            <div className="border-t border-border">
              {g.items.map((it) => {
                const key = `${g.title}-${it.q}`;
                const open = openKey === key || (needle.length > 2 && g.items.length <= 3);
                return (
                  <div key={key} className="border-b border-border">
                    <button onClick={() => setOpenKey(openKey === key ? null : key)} aria-expanded={open} className="flex w-full items-center justify-between gap-6 py-5 text-left font-medium">
                      {it.q}
                      <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-muted">
                        <ChevronDown size={18} />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open ? (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <p className="pb-5 leading-relaxed text-muted">{it.a}</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ContactForm() {
  const t = useTranslations("Help");
  const [v, setV] = useState<ContactInput>({ name: "", email: "", topic: "order", message: "", website: "" });
  const [bad, setBad] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof ContactInput>(k: K, value: ContactInput[K]) => setV((p) => ({ ...p, [k]: value }));
  const field = (k: string) => cn("w-full rounded-xl border bg-background px-4 outline-none focus:border-foreground", bad.includes(k) ? "border-danger" : "border-border");

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl bg-subtle p-10 text-center">
        <p className="font-display text-3xl">{t("sentTitle")}</p>
        <p className="mt-2 text-muted">{t("sentText")}</p>
      </motion.div>
    );
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await sendContactMessage(v);
          if (res.ok) setSent(true);
          else {
            setBad(res.fields ?? []);
            toast.error(t("formError"));
          }
        });
      }}
    >
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">{t("name")}</span>
        <input className={cn(field("name"), "h-12")} value={v.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" required />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">{t("email")}</span>
        <input className={cn(field("email"), "h-12")} type="email" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" required />
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1.5 block text-muted">{t("topic")}</span>
        <select className={cn(field("topic"), "h-12")} value={v.topic} onChange={(e) => set("topic", e.target.value as ContactInput["topic"])}>
          {(["order", "product", "return", "partnership", "other"] as const).map((k) => (
            <option key={k} value={k}>
              {t(`topics.${k}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1.5 block text-muted">{t("message")}</span>
        <textarea className={cn(field("message"), "resize-none py-3")} rows={5} value={v.message} onChange={(e) => set("message", e.target.value)} required minLength={10} />
      </label>
      {/* honeypot, hidden from people */}
      <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={v.website} onChange={(e) => set("website", e.target.value)} />
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />} {t("send")}
        </Button>
      </div>
    </form>
  );
}
