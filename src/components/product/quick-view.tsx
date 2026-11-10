"use client";

import { ArrowUpRight, Check, Loader2, Minus, Plus, ShoppingBag, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLenis } from "lenis/react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import { Link, usePathname } from "@/i18n/navigation";
import type { ProductColor, ProductPhoto } from "@/lib/db/schema";
import { recommendSize } from "@/lib/fit";
import { colorStock, stockOf, type StockMap } from "@/lib/inventory";
import { photosForColor } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useFitProfile } from "@/store/fit-profile";
import { useQuickView } from "@/store/quick-view";
import type { GarmentView } from "./garment-art";
import { ProductImage } from "./product-image";

type Data = {
  id: number;
  slug: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  price: number;
  compareAtPrice: number | null;
  kind: string;
  colors: ProductColor[];
  sizes: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
  images: ProductPhoto[];
  stockMap: StockMap;
};

/** One modal for the whole site, opened from cards and the shop-the-look hotspots. */
export function QuickView() {
  const slug = useQuickView((s) => s.slug);
  const close = useQuickView((s) => s.close);
  const lenis = useLenis();
  const pathname = usePathname();
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    if (!slug) {
      lenis?.start();
      return;
    }
    lenis?.stop();
    let cancelled = false;
    setData(null);
    fetch(`/api/products/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && close());
    return () => {
      cancelled = true;
    };
  }, [slug, lenis, close]);

  // close when navigating away
  useEffect(() => close(), [pathname, close]);

  return (
    <AnimatePresence>
      {slug ? (
        <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6" onKeyDown={(e) => e.key === "Escape" && close()}>
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[92svh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl"
            data-lenis-prevent
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            <button onClick={close} autoFocus className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-subtle" aria-label="Close">
              <X size={18} />
            </button>
            {data ? <Body key={data.id} data={data} onDone={close} /> : <div className="grid h-[60svh] place-items-center"><Loader2 className="animate-spin text-muted" /></div>}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Body({ data, onDone }: { data: Data; onDone: () => void }) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const profile = useFitProfile((s) => s.profile);
  const [colorIndex, setColorIndex] = useState(() => Math.max(0, data.colors.findIndex((c) => colorStock(data.stockMap, c.hex, data.sizes) > 0)));
  const [size, setSize] = useState<string | null>(data.sizes.length === 1 ? data.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<GarmentView>("front");
  const [photoIndex, setPhotoIndex] = useState(0);
  const color = data.colors[colorIndex];
  const photos = photosForColor(data.images, color.hex);
  const photo = photos[Math.min(photoIndex, photos.length - 1)]?.url ?? null;
  const name = locale === "vi" ? data.nameVi : data.nameEn;
  const sizeStock = (s: string) => stockOf(data.stockMap, color.hex, s);
  const available = size ? sizeStock(size) : colorStock(data.stockMap, color.hex, data.sizes);
  const suggestion = profile ? recommendSize(profile, data.sizes) : null;

  function addToCart() {
    if (!size) return toast.error(t("selectSize"));
    if (sizeStock(size) <= 0) return toast.error(t("variantSoldOut"));
    add(
      {
        productId: data.id,
        slug: data.slug,
        nameVi: data.nameVi,
        nameEn: data.nameEn,
        kind: data.kind,
        imageUrl: photos[0]?.url ?? data.imageUrl,
        color,
        size,
        price: data.price,
        maxQuantity: sizeStock(size),
      },
      qty,
    );
    toast.success(t("added"), { description: `${name} · ${locale === "vi" ? color.nameVi : color.nameEn} · ${size} × ${qty}` });
    onDone();
    openCart();
  }

  return (
    <div className="grid sm:grid-cols-2">
      <div className="relative aspect-[5/6] bg-subtle sm:aspect-auto sm:min-h-[560px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${color.hex}-${view}-${photo}`} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ProductImage kind={data.kind} color={color.hex} imageUrl={photo} view={view} alt={name} sizes="(min-width: 640px) 450px, 100vw" />
          </motion.div>
        </AnimatePresence>
        {photos.length > 1 ? (
          <div className="absolute bottom-3 left-3 flex gap-1.5 rounded-full bg-background/80 p-1.5 backdrop-blur">
            {photos.slice(0, 5).map((p, i) => (
              <button
                key={p.url}
                onClick={() => setPhotoIndex(i)}
                aria-label={`${name} ${i + 1}`}
                className={cn("size-2.5 rounded-full transition-all", photo === p.url ? "w-6 bg-foreground" : "bg-foreground/30")}
              />
            ))}
          </div>
        ) : null}
        <div className={cn("absolute bottom-3 left-3 flex gap-1.5 rounded-full bg-background/80 p-1 backdrop-blur", photos.length && "hidden")}>
          {(["front", "back", "detail"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn("rounded-full px-3 py-1 text-xs transition-colors", view === v ? "bg-foreground text-background" : "hover:bg-subtle")}
            >
              {t(v === "front" ? "viewFront" : v === "back" ? "viewBack" : "viewDetail")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-8">
        <h2 className="pr-10 font-display text-3xl leading-tight">{name}</h2>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
          <Stars rating={data.rating} />
          <span>{t("reviews", { count: data.reviewCount })}</span>
        </div>
        <Price price={data.price} compareAtPrice={data.compareAtPrice} locale={locale} large className="mt-4" />
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{locale === "vi" ? data.descriptionVi : data.descriptionEn}</p>

        <p className="mt-6 mb-2 text-sm">
          <span className="text-muted">{t("color")}:</span> <b>{locale === "vi" ? color.nameVi : color.nameEn}</b>
        </p>
        <div className="flex flex-wrap gap-2">
          {data.colors.map((c, i) => (
            <button
              key={c.hex}
              onClick={() => {
                setColorIndex(i);
                setPhotoIndex(0);
              }}
              aria-label={locale === "vi" ? c.nameVi : c.nameEn}
              aria-pressed={i === colorIndex}
              className={cn("grid size-10 place-items-center rounded-full border-2 transition-colors", i === colorIndex ? "border-foreground" : "border-transparent")}
            >
              <span className="size-7 rounded-full border border-foreground/20" style={{ background: c.hex }} />
            </button>
          ))}
        </div>

        <div className="mt-5 mb-2 flex items-center justify-between text-sm">
          <span>
            <span className="text-muted">{t("size")}:</span> <b>{size ?? "—"}</b>
          </span>
          {suggestion ? (
            <span className="flex items-center gap-1 text-accent">
              <Sparkles size={13} /> {t("yourSize", { size: suggestion.size })}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.sizes.map((s) => {
            const out = sizeStock(s) <= 0;
            return (
              <button
                key={s}
                onClick={() => setSize(s)}
                disabled={out}
                aria-pressed={size === s}
                className={cn(
                  "relative h-11 min-w-14 rounded-xl border px-3 text-sm font-medium transition-colors disabled:text-muted disabled:line-through disabled:opacity-50",
                  size === s ? "border-foreground bg-foreground text-background" : "border-border enabled:hover:border-foreground",
                )}
              >
                {suggestion?.size === s ? <span className="absolute top-1 right-1 size-1.5 rounded-full bg-accent" /> : null}
                {s}
              </button>
            );
          })}
        </div>
        {available > 0 && available <= 5 ? <p className="mt-3 text-sm text-accent">{t("lowStock", { count: available })}</p> : null}

        <div className="mt-auto flex gap-2 pt-6">
          <div className="flex h-12 items-center rounded-full border border-border">
            <button className="grid h-full w-10 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="-">
              <Minus size={14} />
            </button>
            <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
            <button className="grid h-full w-10 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.min(Math.max(1, available), q + 1))} disabled={qty >= available} aria-label="+">
              <Plus size={14} />
            </button>
          </div>
          <Button className="h-12 flex-1" onClick={addToCart} disabled={available <= 0}>
            {available <= 0 ? t("soldOut") : <><ShoppingBag size={16} /> {t("addToCart")}</>}
          </Button>
        </div>
        <Link href={`/product/${data.slug}`} className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted hover:text-foreground">
          {t("viewDetails")} <ArrowUpRight size={14} />
        </Link>
        {size && sizeStock(size) > 0 ? (
          <p className="mt-2 flex items-center justify-center gap-1 text-xs text-success">
            <Check size={12} /> {t("inStock")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
