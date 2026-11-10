"use client";

import { Check, ChevronDown, ChevronLeft, ChevronRight, Expand, Heart, Minus, Plus, RotateCcw, Ruler, Share2, ShieldCheck, ShoppingBag, Sparkles, Truck, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLenis } from "lenis/react";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import { useMounted } from "@/hooks/use-mounted";
import { useRouter } from "@/i18n/navigation";
import type { Product } from "@/lib/db/schema";
import { flyToCart } from "@/lib/fly-to-cart";
import { colorStock, LOW_STOCK_THRESHOLD, stockOf, type StockMap } from "@/lib/inventory";
import { discountPercent, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { photosForColor } from "@/lib/photos";
import { SIZE_GUIDE } from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useRecentlyViewed } from "@/store/recently-viewed";
import { useFitProfile } from "@/store/fit-profile";
import { recommendSize } from "@/lib/fit";
import { Lightbox } from "./lightbox";
import { SizeFinder } from "./size-finder";
import type { GarmentView } from "./garment-art";
import { ProductImage } from "./product-image";

type Props = {
  product: Pick<
    Product,
    | "id" | "slug" | "nameVi" | "nameEn" | "descriptionVi" | "descriptionEn" | "price" | "compareAtPrice"
    | "kind" | "colors" | "sizes" | "stock" | "isNew" | "rating" | "reviewCount" | "imageUrl" | "images"
  > & { stockMap: StockMap };
};

export function ProductDetail({ product }: Props) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const router = useRouter();
  const mounted = useMounted();
  const [colorIndex, setColorIndex] = useState(() =>
    Math.max(0, product.colors.findIndex((c) => colorStock(product.stockMap, c.hex, product.sizes) > 0)),
  );
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<GarmentView>("front");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const fitProfile = useFitProfile((s) => s.profile);
  const imageRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLDivElement>(null);

  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const wished = useWishlist((s) => s.items.some((p) => p.id === product.id));
  const toggleWish = useWishlist((s) => s.toggle);

  const color = product.colors[colorIndex];
  const photos = photosForColor(product.images, color.hex);
  const current = Math.min(photoIndex, Math.max(0, photos.length - 1));
  const photo = photos[current]?.url ?? null;
  const stepPhoto = (d: number) => {
    if (photos.length > 1) setPhotoIndex((current + d + photos.length) % photos.length);
  };
  const name = locale === "vi" ? product.nameVi : product.nameEn;
  const description = locale === "vi" ? product.descriptionVi : product.descriptionEn;
  const soldOut = product.stock <= 0;
  const off = discountPercent(product.price, product.compareAtPrice);
  // stock of the selected colour + size (or the whole colour until a size is picked)
  const sizeStock = (s: string) => stockOf(product.stockMap, color.hex, s);
  const available = size ? sizeStock(size) : colorStock(product.stockMap, color.hex, product.sizes);
  const variantSoldOut = soldOut || available <= 0;
  const suggestion = mounted && fitProfile ? recommendSize(fitProfile, product.sizes) : null;

  const track = useRecentlyViewed((s) => s.track);
  useEffect(() => {
    track({
      id: product.id,
      slug: product.slug,
      nameVi: product.nameVi,
      nameEn: product.nameEn,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      kind: product.kind,
      color: product.colors[0]?.hex ?? "#cccccc",
      imageUrl: photosForColor(product.images, product.colors[0]?.hex)[0]?.url ?? product.imageUrl,
    });
  }, [product, track]);

  // keep the quantity within what is left of the chosen variant
  useEffect(() => {
    if (size && qty > Math.max(1, sizeStock(size))) setQty(Math.max(1, sizeStock(size)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, colorIndex]);

  // Show the sticky mobile bar once the main button has scrolled above the viewport.
  // Checked on every scroll (not IntersectionObserver) so fast jumps past the button are caught too.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", () => {
    const el = addBtnRef.current;
    if (el) setShowSticky(el.getBoundingClientRect().bottom < 0);
  });

  function addToCart(goToCheckout = false) {
    if (!size) {
      setSizeError(true);
      toast.error(t("selectSize"));
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (sizeStock(size) <= 0) {
      toast.error(t("variantSoldOut"));
      return;
    }
    add(
      {
        productId: product.id,
        slug: product.slug,
        nameVi: product.nameVi,
        nameEn: product.nameEn,
        kind: product.kind,
        imageUrl: photos[0]?.url ?? product.imageUrl,
        color,
        size,
        price: product.price,
        maxQuantity: sizeStock(size),
      },
      qty,
    );
    if (goToCheckout) {
      router.push("/checkout");
      return;
    }
    flyToCart(imageRef.current);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
    toast.success(t("added"), {
      description: `${name} · ${locale === "vi" ? color.nameVi : color.nameEn} · ${size} × ${qty}`,
      action: { label: "→", onClick: openCart },
    });
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("copied"));
      }
    } catch {
      /* user cancelled */
    }
  }

  const views: { key: GarmentView; label: string }[] = [
    { key: "front", label: t("viewFront") },
    { key: "back", label: t("viewBack") },
    { key: "detail", label: t("viewDetail") },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      {/* Gallery */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="flex flex-col-reverse gap-4 sm:flex-row">
          <div className="flex gap-3 sm:flex-col" role="tablist">
            {photos.length
              ? photos.slice(0, 5).map((p, i) => (
                  <button
                    key={p.url}
                    role="tab"
                    aria-selected={photo === p.url}
                    aria-label={`${name} ${i + 1}`}
                    onClick={() => setPhotoIndex(i)}
                    className={cn(
                      "relative aspect-[3/4] w-20 overflow-hidden rounded-xl border-2 transition-all sm:w-24",
                      photo === p.url ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100",
                    )}
                  >
                    <ProductImage kind={product.kind} color={color.hex} imageUrl={p.url} alt="" sizes="96px" />
                  </button>
                ))
              : null}
            {photos.length ? null : views.map((v) => (
              <button
                key={v.key}
                role="tab"
                aria-selected={view === v.key}
                aria-label={v.label}
                onClick={() => setView(v.key)}
                className={cn(
                  "relative aspect-[5/6] w-20 overflow-hidden rounded-xl border-2 transition-all sm:w-24",
                  view === v.key ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <ProductImage kind={product.kind} color={color.hex} imageUrl={product.imageUrl} view={v.key} alt="" />
              </button>
            ))}
          </div>
          <ZoomImage refEl={imageRef} onOpen={photos.length ? () => setViewer(current) : undefined} onSwipe={stepPhoto}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${color.hex}-${view}-${photo}`}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0"
              >
                <ProductImage kind={product.kind} color={color.hex} imageUrl={photo} view={view} alt={name} sizes="(min-width: 1024px) 50vw, 100vw" priority />
              </motion.div>
            </AnimatePresence>
            <div className="pointer-events-none absolute top-4 left-4 flex gap-2">
              {off > 0 ? <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{t("sale", { percent: off })}</span> : null}
              {product.isNew ? <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase">{t("new")}</span> : null}
            </div>
            {photos.length ? (
              <span className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs text-[#1a1714] backdrop-blur">
                <Expand size={13} /> {current + 1} / {photos.length}
              </span>
            ) : null}
            {photos.length > 1 ? (
              <>
                <GalleryArrow side="left" label={t("prevPhoto")} onClick={() => stepPhoto(-1)} />
                <GalleryArrow side="right" label={t("nextPhoto")} onClick={() => stepPhoto(1)} />
              </>
            ) : null}
          </ZoomImage>
        </div>
      </div>

      {/* Info */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{name}</h1>
          <div className="flex shrink-0 gap-1">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => toggleWish(product)}
              aria-pressed={mounted && wished}
              aria-label={mounted && wished ? t("wishlistRemove") : t("wishlistAdd")}
              className="grid size-11 place-items-center rounded-full border border-border hover:border-foreground"
            >
              <Heart size={18} className={cn(mounted && wished && "fill-accent text-accent")} />
            </motion.button>
            <button onClick={share} aria-label={t("share")} className="grid size-11 place-items-center rounded-full border border-border hover:border-foreground">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <a href="#reviews" className="mt-3 flex w-fit items-center gap-2 text-sm text-muted hover:text-foreground">
          <Stars rating={product.rating} />
          <span>{product.reviewCount ? product.rating.toFixed(1) : "—"}</span>
          <span>·</span>
          <span className="underline-offset-4 hover:underline">{t("reviews", { count: product.reviewCount })}</span>
        </a>

        <Price price={product.price} compareAtPrice={product.compareAtPrice} locale={locale} large className="mt-6" />

        {/* Colour */}
        <div className="mt-8">
          <p className="mb-3 text-sm">
            <span className="text-muted">{t("color")}:</span> <b>{locale === "vi" ? color.nameVi : color.nameEn}</b>
          </p>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((c, i) => (
              <button
                key={c.hex}
                onClick={() => {
                  setColorIndex(i);
                  setPhotoIndex(0);
                }}
                aria-label={locale === "vi" ? c.nameVi : c.nameEn}
                aria-pressed={i === colorIndex}
                className="relative grid size-11 place-items-center rounded-full"
              >
                {i === colorIndex ? (
                  <motion.span layoutId="color-ring" className="absolute inset-0 rounded-full border-2 border-foreground" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                ) : null}
                <span className="size-8 rounded-full border border-foreground/20" style={{ background: c.hex }} />
                {colorStock(product.stockMap, c.hex, product.sizes) <= 0 ? (
                  <span aria-hidden className="absolute h-px w-9 rotate-45 bg-foreground/70" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div id="size-picker" className="mt-8">
          <div className="mb-3 flex items-center justify-between text-sm">
            <p>
              <span className="text-muted">{t("size")}:</span> <b>{size ?? "—"}</b>
            </p>
            {product.sizes[0] !== "FREE" ? (
              <span className="flex items-center gap-4">
                <button onClick={() => setFinderOpen(true)} className="flex items-center gap-1.5 text-accent underline-offset-4 hover:underline">
                  <Sparkles size={14} /> {suggestion ? t("yourSize", { size: suggestion.size }) : t("findSize")}
                </button>
                <button onClick={() => setGuideOpen(true)} className="flex items-center gap-1.5 text-muted underline underline-offset-4 hover:text-foreground">
                  <Ruler size={14} /> {t("sizeGuide")}
                </button>
              </span>
            ) : null}
          </div>
          <motion.div
            className="flex flex-wrap gap-2"
            animate={sizeError ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.45 }}
            onAnimationComplete={() => setSizeError(false)}
          >
            {product.sizes.map((s) => {
              const out = sizeStock(s) <= 0;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  disabled={out}
                  title={out ? t("variantSoldOut") : undefined}
                  className={cn(
                    "relative isolate h-12 min-w-16 overflow-hidden rounded-xl border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50",
                    size === s ? "border-foreground text-background" : "border-border enabled:hover:border-foreground",
                    sizeError && !size && "border-danger",
                  )}
                >
                  {size === s ? (
                    <motion.span layoutId="size-pill" className="absolute inset-0 -z-10 rounded-xl bg-foreground" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                  ) : null}
                  {out ? <span aria-hidden className="absolute inset-0 m-auto h-px w-[120%] -translate-x-[8%] -rotate-[20deg] bg-border" /> : null}
                  {suggestion?.size === s ? <span aria-label={t("suggested")} className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent" /> : null}
                  <span className="relative">{s}</span>
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Stock */}
        <div className="mt-6 text-sm">
          {variantSoldOut ? (
            <p className="text-danger">{soldOut ? t("outOfStock") : t("variantSoldOut")}</p>
          ) : available <= LOW_STOCK_THRESHOLD ? (
            <div>
              <p className="flex items-center gap-2 text-accent">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                {t("lowStock", { count: available })}
              </p>
              <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-subtle">
                <motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${(available / 10) * 100}%` }} transition={{ duration: 1 }} />
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-success">
              <Check size={16} /> {t("inStock")}
            </p>
          )}
        </div>

        {/* Quantity + add */}
        <div ref={addBtnRef} className="mt-6 flex flex-wrap gap-3">
          <div className="flex h-14 items-center rounded-full border border-border">
            <button className="grid h-full w-12 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1 || soldOut} aria-label="-">
              <Minus size={16} />
            </button>
            <span className="w-8 text-center tabular-nums" aria-label={t("quantity")}>
              {qty}
            </span>
            <button className="grid h-full w-12 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.min(Math.max(1, available), q + 1))} disabled={qty >= available || variantSoldOut} aria-label="+">
              <Plus size={16} />
            </button>
          </div>
          <Button size="lg" className="min-w-52 flex-1" onClick={() => addToCart()} disabled={variantSoldOut}>
            <AnimatePresence mode="wait" initial={false}>
              {justAdded ? (
                <motion.span key="ok" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                  <Check size={18} /> {t("added")}
                </motion.span>
              ) : (
                <motion.span key="add" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center gap-2">
                  <ShoppingBag size={18} /> {variantSoldOut ? t("soldOut") : t("addToCart")}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          <Button size="lg" variant="outline" className="w-full" onClick={() => addToCart(true)} disabled={variantSoldOut}>
            {t("buyNow")}
          </Button>
        </div>

        <TrustBlock />

        {/* Accordions */}
        <div className="mt-10 border-t border-border">
          <Accordion title={t("description")} defaultOpen>
            <p className="leading-relaxed text-muted">{description}</p>
          </Accordion>
          <Accordion title={t("details")}>
            <p className="leading-relaxed text-muted">{t("detailsText")}</p>
          </Accordion>
          <Accordion title={t("shipping")}>
            <p className="leading-relaxed text-muted">{t("shippingText")}</p>
          </Accordion>
        </div>
      </div>

      {/* Sticky mobile bar */}
      <AnimatePresence>
        {showSticky && !variantSoldOut ? (
          <motion.div
            initial={{ y: "120%" }}
            animate={{ y: 0 }}
            exit={{ y: "120%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-2xl border border-border bg-background/90 p-2.5 shadow-2xl backdrop-blur-xl md:bottom-3 lg:hidden"
          >
            <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg">
              <ProductImage kind={product.kind} color={color.hex} imageUrl={photos[0]?.url ?? product.imageUrl} alt="" sizes="48px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <Price price={product.price} compareAtPrice={product.compareAtPrice} locale={locale} />
            </div>
            <Button size="md" onClick={() => addToCart()}>
              <ShoppingBag size={16} /> {size ?? t("size")}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Lightbox
        photos={photos.map((p) => p.url)}
        index={viewer}
        onIndex={(i) => {
          setViewer(i);
          setPhotoIndex(i);
        }}
        onClose={() => setViewer(null)}
        alt={name}
      />
      <SizeGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
      <SizeFinder
        open={finderOpen}
        onClose={() => setFinderOpen(false)}
        sizes={product.sizes}
        onPick={(s) => {
          if (sizeStock(s) > 0) setSize(s);
          else toast.message(t("suggestedSoldOut", { size: s }));
        }}
      />
    </div>
  );
}

/** Main image with a hover magnifier that follows the cursor. */
function ZoomImage({
  children,
  refEl,
  onOpen,
  onSwipe,
}: {
  children: React.ReactNode;
  refEl: React.RefObject<HTMLDivElement | null>;
  onOpen?: () => void;
  onSwipe: (dir: number) => void;
}) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const touch = useRef<{ x: number; moved: boolean } | null>(null);
  return (
    <div
      ref={refEl}
      data-cursor="Zoom"
      className="group/zoom relative aspect-[3/4] flex-1 cursor-zoom-in touch-pan-y overflow-hidden rounded-3xl bg-[#efe8dd] dark:bg-subtle"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        if (touch.current?.moved) return;
        onOpen?.();
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") touch.current = { x: e.clientX, moved: false };
      }}
      onPointerUp={(e) => {
        const start = touch.current;
        if (!start || e.pointerType === "mouse") return;
        const dx = e.clientX - start.x;
        if (Math.abs(dx) > 40) {
          start.moved = true;
          onSwipe(dx < 0 ? 1 : -1);
        }
        setTimeout(() => (touch.current = null), 0);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onPointerLeave={() => setZoom(null)}
    >
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{
          transform: zoom ? "scale(1.9)" : "scale(1)",
          transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function GalleryArrow({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[#1a1714] opacity-0 shadow-sm backdrop-blur transition-opacity group-hover/zoom:opacity-100 focus-visible:opacity-100 max-lg:hidden",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      {side === "left" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
  );
}

/** Delivery estimate, free returns and payment methods, right under the buy buttons. */
function TrustBlock() {
  const t = useTranslations("Product");
  const locale = useLocale();
  const mounted = useMounted();
  const fmt = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", { weekday: "short", day: "numeric", month: "numeric" });
  const inDays = (d: number) => fmt.format(new Date(Date.now() + d * 86_400_000));
  const rows = [
    {
      icon: Truck,
      title: mounted ? t("deliveryBy", { from: inDays(2), to: inDays(4) }) : t("deliveryDays"),
      hint: t("freeShipOver", { amount: formatPrice(FREE_SHIPPING_THRESHOLD, locale) }),
    },
    { icon: RotateCcw, title: t("returnsTitle"), hint: t("returnsHint") },
    { icon: ShieldCheck, title: t("secureTitle"), hint: "COD · VietQR · VNPay" },
  ];
  return (
    <ul className="mt-8 divide-y divide-border rounded-2xl border border-border">
      {rows.map((r) => (
        <li key={r.hint} className="flex items-start gap-4 px-5 py-4">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-subtle">
            <r.icon size={17} strokeWidth={1.6} />
          </span>
          <div className="text-sm">
            <p className="font-medium">{r.title}</p>
            <p className="mt-0.5 text-muted">{r.hint}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Accordion({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-5 text-left font-medium">
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className="pb-5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SizeGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Product");
  const lenis = useLenis();
  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" onKeyDown={(e) => e.key === "Escape" && onClose()}>
          <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
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
            <button onClick={onClose} className="absolute top-4 right-4 grid size-10 place-items-center rounded-full hover:bg-subtle" aria-label="Close" autoFocus>
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
                    <motion.tr key={r.size} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="border-b border-border/60">
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
