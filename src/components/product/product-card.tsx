"use client";

import { Eye, Heart, Plus } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { flyToCart } from "@/components/cart/fly-to-cart";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import { useMounted } from "@/hooks/use-mounted";
import { Link } from "@/i18n/navigation";
import { stockOf } from "@/lib/inventory";
import { photosForColor } from "@/lib/photos/gallery";
import { discountPercent } from "@/lib/pricing";
import type { ProductCardData } from "@/lib/server/queries/catalog";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useQuickView } from "@/store/quick-view";
import { useWishlist } from "@/store/wishlist";
import { ProductImage } from "./product-image";

export function ProductCard({ product }: { product: ProductCardData }) {
  const t = useTranslations("Product");
  const locale = useLocale();
  const mounted = useMounted();
  const [colorIndex, setColorIndex] = useState(0);
  const [quickOpen, setQuickOpen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const add = useCart((s) => s.add);
  const wished = useWishlist((s) => s.items.some((p) => p.id === product.id));
  const toggleWish = useWishlist((s) => s.toggle);
  const openQuick = useQuickView((s) => s.open);

  const color = product.colors[colorIndex] ?? { hex: "#cccccc", nameVi: "", nameEn: "" };
  const name = locale === "vi" ? product.nameVi : product.nameEn;
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;
  const photos = photosForColor(product.images, color.hex);
  const mainPhoto = photos[0]?.url ?? product.imageUrl;
  // older wishlist entries saved in localStorage have no stock map: fall back to the total
  const sizeStock = (size: string) => (product.stockMap ? stockOf(product.stockMap, color.hex, size) : product.stock);

  // subtle 3D tilt that follows the pointer
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [5, -5]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-5, 5]), { stiffness: 200, damping: 20 });
  const glare = useTransform(mx, (x) => `radial-gradient(circle at ${Math.round(x * 100)}% 30%, rgba(255,255,255,.55), transparent 55%)`);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }
  function onLeave() {
    mx.set(0.5);
    my.set(0.5);
    setQuickOpen(false);
  }

  function quickAdd(size: string) {
    add({
      productId: product.id,
      slug: product.slug,
      nameVi: product.nameVi,
      nameEn: product.nameEn,
      kind: product.kind,
      imageUrl: mainPhoto,
      color,
      size,
      price: product.price,
      maxQuantity: Math.max(1, sizeStock(size)),
    });
    flyToCart(imageRef.current);
    setQuickOpen(false);
    toast.success(t("added"), { description: `${name} · ${locale === "vi" ? color.nameVi : color.nameEn} · ${size}` });
  }

  function onWish() {
    const added = toggleWish(product);
    toast(added ? t("wishlistAdd") : t("wishlistRemove"), { description: name });
  }

  return (
    <article className="group/card relative min-w-0">
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        className="relative"
      >
        <Link href={`/product/${product.slug}`} className="block" aria-label={name} data-cursor={locale === "vi" ? "Xem" : "View"}>
          <div ref={imageRef} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#efe8dd] dark:bg-subtle">
            <div className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover/card:scale-[1.04]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={color.hex}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <ProductImage kind={product.kind} color={color.hex} imageUrl={mainPhoto} alt={name} sizes="(min-width: 1024px) 25vw, 50vw" />
                  {photos[1] || !mainPhoto ? (
                    <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100">
                      <ProductImage kind={product.kind} color={color.hex} imageUrl={photos[1]?.url} view="back" alt="" sizes="(min-width: 1024px) 25vw, 50vw" />
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* moving glare */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover/card:opacity-100"
              style={{ background: glare }}
            />

            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
              {soldOut ? (
                <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold tracking-wider text-background uppercase">
                  {t("soldOut")}
                </span>
              ) : null}
              {off > 0 ? (
                <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold tracking-wider text-accent-foreground">
                  {t("sale", { percent: off })}
                </span>
              ) : null}
              {product.isNew ? (
                <span className="rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase backdrop-blur">
                  {t("new")}
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        <button
          onClick={() => openQuick(product.slug)}
          aria-label={t("quickView")}
          title={t("quickView")}
          className="absolute top-14 right-3 grid size-9 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-all duration-300 hover:scale-110 md:translate-x-2 md:opacity-0 md:group-hover/card:translate-x-0 md:group-hover/card:opacity-100"
        >
          <Eye size={16} />
        </button>

        <motion.button
          onClick={onWish}
          whileTap={{ scale: 0.8 }}
          aria-pressed={mounted && wished}
          aria-label={mounted && wished ? t("wishlistRemove") : t("wishlistAdd")}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-transform hover:scale-110"
        >
          <motion.span
            key={mounted && wished ? "on" : "off"}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 600, damping: 15 }}
          >
            <Heart size={16} className={cn(mounted && wished && "fill-accent text-accent")} />
          </motion.span>
        </motion.button>

        {/* quick add */}
        {!soldOut ? (
          <>
            <button
              onClick={() => setQuickOpen((v) => !v)}
              aria-label={t("quickAdd")}
              className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-foreground text-background shadow-lg md:hidden"
            >
              <Plus size={18} className={cn("transition-transform", quickOpen && "rotate-45")} />
            </button>
            <div
              className={cn(
                "absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 ease-out-expo md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100",
                quickOpen && "max-md:right-14 max-md:translate-y-0 max-md:opacity-100",
                !quickOpen && "max-md:pointer-events-none",
              )}
            >
              <div className="rounded-xl bg-background/90 p-2 text-foreground shadow-lg backdrop-blur-md">
                <p className="mb-1.5 px-1 text-[10px] font-semibold tracking-[0.15em] text-muted uppercase">{t("quickAdd")}</p>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map((s) => {
                    const out = sizeStock(s) <= 0;
                    return (
                      <button
                        key={s}
                        onClick={() => quickAdd(s)}
                        disabled={out}
                        title={out ? t("soldOut") : undefined}
                        className="h-8 min-w-9 flex-1 rounded-lg border border-border px-2 text-xs font-medium transition-colors enabled:hover:border-foreground enabled:hover:bg-foreground enabled:hover:text-background disabled:text-muted disabled:line-through disabled:opacity-50"
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </motion.div>

      <div className="mt-4 space-y-1.5 px-0.5">
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label={t("color")}>
          {product.colors.map((c, i) => (
            <button
              key={c.hex}
              role="radio"
              aria-checked={i === colorIndex}
              aria-label={locale === "vi" ? c.nameVi : c.nameEn}
              title={locale === "vi" ? c.nameVi : c.nameEn}
              onClick={() => setColorIndex(i)}
              onMouseEnter={() => setColorIndex(i)}
              className={cn(
                "size-4 rounded-full border border-foreground/20 ring-offset-2 ring-offset-background transition-all",
                i === colorIndex ? "ring-1 ring-foreground" : "hover:scale-110",
              )}
              style={{ background: c.hex }}
            />
          ))}
          {product.colors.length > 1 ? <span className="ml-1 text-[11px] text-muted">{t("colorCount", { count: product.colors.length })}</span> : null}
        </div>
        <Link href={`/product/${product.slug}`} className="block">
          <h3 className="line-clamp-1 text-[15px] font-medium transition-colors group-hover/card:text-accent">{name}</h3>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} locale={locale} />
          <div className="hidden items-center gap-1 text-xs text-muted min-[480px]:flex">
            <Stars rating={product.rating} size={11} />
            <span>({product.reviewCount})</span>
          </div>
        </div>
      </div>
    </article>
  );
}
