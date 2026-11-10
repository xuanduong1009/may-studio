"use client";

import { ArrowRight, Clock, CornerDownLeft, Loader2, Search, Tag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { ProductImage } from "@/components/product/product-image";
import { Price } from "@/components/ui/price";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Result = {
  products: { id: number; slug: string; nameVi: string; nameEn: string; price: number; compareAtPrice: number | null; kind: string; color: string; imageUrl: string | null }[];
  categories: { slug: string; nameVi: string; nameEn: string }[];
  total: number;
};

const RECENT_KEY = "may-recent-searches";
const TRENDING = ["Linen", "Hoodie", "Sơ mi", "Tote", "Đầm", "Jean"];

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 5);
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

/** Search overlay with live results. Opens with the header button, Ctrl+K or "/". */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Search");
  const locale = useLocale();
  const router = useRouter();
  const lenis = useLenis();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  // global shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      lenis?.stop();
      setRecent(readRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      lenis?.start();
    }
  }, [open, lenis]);

  // debounced live search; stale responses are ignored
  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        setResult(await res.json());
        setActive(0);
      } catch {
        /* aborted */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const close = useCallback(() => {
    onOpenChange(false);
    setQ("");
    setResult(null);
  }, [onOpenChange]);

  const go = useCallback(
    (href: string, remember?: string) => {
      if (remember) saveRecent(remember);
      router.push(href);
      close();
    },
    [router, close],
  );

  const options = result?.products ?? [];
  const searchAll = () => q.trim() && go(`/shop?q=${encodeURIComponent(q.trim())}`, q.trim());

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active < options.length && options[active]) go(`/product/${options[active].slug}`, q.trim());
      else searchAll();
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-3 pt-[10vh] sm:pt-[14vh]" onKeyDown={onKeyDown}>
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            <div className="flex items-center gap-3 border-b border-border px-5">
              {loading ? <Loader2 size={20} className="shrink-0 animate-spin text-muted" /> : <Search size={20} className="shrink-0 text-muted" />}
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("title")}
                role="combobox"
                aria-expanded={options.length > 0}
                aria-controls="search-results"
                aria-activedescendant={options[active] ? `search-opt-${active}` : undefined}
                className="h-16 w-full bg-transparent text-lg outline-none placeholder:text-muted/70"
              />
              <button onClick={close} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-subtle" aria-label={t("close")}>
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3" data-lenis-prevent>
              {!q.trim() ? (
                <div className="space-y-5 p-2">
                  {recent.length ? (
                    <Group title={t("recent")}>
                      {recent.map((r) => (
                        <Chip key={r} onClick={() => setQ(r)} icon={<Clock size={13} />}>
                          {r}
                        </Chip>
                      ))}
                    </Group>
                  ) : null}
                  <Group title={t("trending")}>
                    {TRENDING.map((r) => (
                      <Chip key={r} onClick={() => setQ(r)}>
                        {r}
                      </Chip>
                    ))}
                  </Group>
                </div>
              ) : result && result.total === 0 && !loading ? (
                <p className="px-3 py-10 text-center text-sm text-muted">{t("empty", { q: q.trim() })}</p>
              ) : (
                <>
                  {result?.categories.length ? (
                    <div className="mb-2 flex flex-wrap gap-2 px-2 pt-1">
                      {result.categories.map((c) => (
                        <Chip key={c.slug} onClick={() => go(`/shop?category=${c.slug}`)} icon={<Tag size={13} />}>
                          {locale === "vi" ? c.nameVi : c.nameEn}
                        </Chip>
                      ))}
                    </div>
                  ) : null}
                  <ul id="search-results" role="listbox">
                    {options.map((p, i) => (
                      <li key={p.id} id={`search-opt-${i}`} role="option" aria-selected={i === active}>
                        <button
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(`/product/${p.slug}`, q.trim())}
                          className={cn("flex w-full items-center gap-4 rounded-2xl p-2 text-left transition-colors", i === active && "bg-subtle")}
                        >
                          <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl">
                            <ProductImage kind={p.kind} color={p.color} imageUrl={p.imageUrl} alt="" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{locale === "vi" ? p.nameVi : p.nameEn}</p>
                            <Price price={p.price} compareAtPrice={p.compareAtPrice} locale={locale} />
                          </div>
                          {i === active ? <CornerDownLeft size={16} className="mr-2 text-muted" /> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {result && result.total > 0 ? (
                    <button
                      onMouseEnter={() => setActive(options.length)}
                      onClick={searchAll}
                      className={cn("mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition-colors", active === options.length && "bg-subtle")}
                    >
                      {t("seeAll", { count: result.total, q: q.trim() })}
                      <ArrowRight size={16} />
                    </button>
                  ) : null}
                </>
              )}
            </div>

            <div className="hidden items-center gap-4 border-t border-border px-5 py-2.5 text-[11px] text-muted sm:flex">
              <span>
                <Kbd>↑</Kbd> <Kbd>↓</Kbd> {t("navigate")}
              </span>
              <span>
                <Kbd>Enter</Kbd> {t("open")}
              </span>
              <span>
                <Kbd>Esc</Kbd> {t("close")}
              </span>
              <span className="ml-auto">
                <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
              </span>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:border-foreground">
      {icon ? <span className="text-muted">{icon}</span> : null}
      {children}
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-md border border-border bg-subtle px-1.5 py-0.5 font-sans text-[10px]">{children}</kbd>;
}
