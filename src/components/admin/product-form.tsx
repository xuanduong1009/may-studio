"use client";

import { Loader2, Plus, Save, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveProduct } from "@/app/actions/admin";
import { ProductPhotos } from "@/components/admin/product-photos";
import { ProductImage } from "@/components/product/product-image";
import { Button, buttonClasses } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { Link, useRouter } from "@/i18n/navigation";
import { GARMENT_KINDS, type GarmentKind } from "@/lib/constants";
import type { Product, ProductColor, ProductVariant } from "@/lib/db/schema";
import { variantKey } from "@/lib/inventory";
import { photosForColor } from "@/lib/photos/gallery";
import { ALL_SIZES, PALETTE } from "@/lib/site";
import { cn, slugify } from "@/lib/utils";

type Category = { id: number; nameVi: string; nameEn: string };

export function ProductForm({ product, categories }: { product?: Product & { variants: ProductVariant[] }; categories: Category[] }) {
  const t = useTranslations("Admin");
  const f = useTranslations("Admin.fields");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [v, setV] = useState({
    nameVi: product?.nameVi ?? "",
    nameEn: product?.nameEn ?? "",
    slug: product?.slug ?? "",
    descriptionVi: product?.descriptionVi ?? "",
    descriptionEn: product?.descriptionEn ?? "",
    price: product?.price ?? 300000,
    compareAtPrice: product?.compareAtPrice ?? null,
    categoryId: product?.categoryId ?? categories[0]?.id ?? 1,
    kind: (product?.kind ?? "tee") as GarmentKind,
    colors: product?.colors ?? ([{ nameVi: PALETTE[2].nameVi, nameEn: PALETTE[2].nameEn, hex: PALETTE[2].hex }] as ProductColor[]),
    sizes: product?.sizes ?? ["S", "M", "L"],
    featured: product?.featured ?? false,
    isNew: product?.isNew ?? true,
    imageUrl: product?.imageUrl ?? "",
    images: product?.images ?? [],
  });

  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((prev) => ({ ...prev, [key]: value }));

  // stock per colour x size; new combinations start at 10
  const [stock, setStock] = useState<Record<string, number>>(() =>
    Object.fromEntries((product?.variants ?? []).map((x) => [variantKey(x.colorHex, x.size), x.stock])),
  );
  const stockAt = (hex: string, size: string) => stock[variantKey(hex, size)] ?? (product ? 0 : 10);
  const setStockAt = (hex: string, size: string, n: number) => setStock((prev) => ({ ...prev, [variantKey(hex, size)]: Math.max(0, Math.min(100_000, n || 0)) }));
  const total = v.colors.reduce((sum, c) => sum + v.sizes.reduce((s2, size) => s2 + stockAt(c.hex, size), 0), 0);
  const [fillValue, setFillValue] = useState("");
  const bad = (key: string) => errors.includes(key);
  const preview = v.colors[previewIndex % Math.max(v.colors.length, 1)] ?? { hex: "#ccc", nameVi: "", nameEn: "" };
  const previewPhoto = photosForColor(v.images, preview.hex)[0]?.url ?? (v.imageUrl || null);

  function removeColor(index: number) {
    const hex = v.colors[index]?.hex.toLowerCase();
    // photos of a removed colour stay, shown for every colour
    setV((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, j) => j !== index),
      images: prev.images.map((im) => (im.colorHex?.toLowerCase() === hex ? { ...im, colorHex: null } : im)),
    }));
  }

  function addColor(c: ProductColor) {
    if (v.colors.some((x) => x.hex.toLowerCase() === c.hex.toLowerCase())) return;
    set("colors", [...v.colors, c]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveProduct(product?.id ?? null, {
        ...v,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        variants: v.colors.flatMap((c) => v.sizes.map((size) => ({ colorHex: c.hex, size, stock: stockAt(c.hex, size) }))),
        imageUrl: v.imageUrl || null,
      });
      if (res.ok) {
        setErrors([]);
        toast.success(t("saved"));
        router.push("/admin/products");
        router.refresh();
      } else {
        setErrors(res.fields ?? []);
        toast.error(res.error === "readonly" ? t("readonly") : t("invalid"));
      }
    });
  }

  const input = (key: string) =>
    cn("h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none focus:border-foreground", bad(key) ? "border-danger" : "border-border");

  return (
    <form onSubmit={submit} className="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Label text={f("nameVi")}>
            <input
              className={input("nameVi")}
              value={v.nameVi}
              onChange={(e) => {
                set("nameVi", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              required
            />
          </Label>
          <Label text={f("nameEn")}>
            <input className={input("nameEn")} value={v.nameEn} onChange={(e) => set("nameEn", e.target.value)} required />
          </Label>
          <Label text={f("slug")} className="sm:col-span-2">
            <input
              className={cn(input("slug"), "font-mono")}
              value={v.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              required
            />
          </Label>
          <Label text={f("descriptionVi")}>
            <textarea rows={4} className={cn(input("descriptionVi"), "h-auto py-3")} value={v.descriptionVi} onChange={(e) => set("descriptionVi", e.target.value)} />
          </Label>
          <Label text={f("descriptionEn")}>
            <textarea rows={4} className={cn(input("descriptionEn"), "h-auto py-3")} value={v.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
          </Label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Label text={f("price")}>
            <input type="number" min={1000} step={1000} className={input("price")} value={v.price} onChange={(e) => set("price", Number(e.target.value))} required />
          </Label>
          <Label text={f("compareAtPrice")}>
            <input type="number" min={0} step={1000} className={input("compareAtPrice")} value={v.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)} />
          </Label>
          <Label text={f("category")}>
            <select className={input("categoryId")} value={v.categoryId} onChange={(e) => set("categoryId", Number(e.target.value))}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "vi" ? c.nameVi : c.nameEn}
                </option>
              ))}
            </select>
          </Label>
          <Label text={f("kind")} className="sm:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {GARMENT_KINDS.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => set("kind", k)}
                  className={cn("rounded-full border px-3 py-1.5 text-xs capitalize transition-colors", v.kind === k ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground")}
                >
                  {k}
                </button>
              ))}
            </div>
          </Label>
        </div>

        <Label text={f("colors")}>
          <div className={cn("rounded-xl border p-3", bad("colors") ? "border-danger" : "border-border")}>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {v.colors.map((c, i) => (
                  <motion.span
                    layout
                    key={c.hex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 rounded-full bg-subtle py-1 pr-1 pl-1.5 text-xs"
                    onMouseEnter={() => setPreviewIndex(i)}
                  >
                    <span className="size-5 rounded-full border border-foreground/20" style={{ background: c.hex }} />
                    {locale === "vi" ? c.nameVi : c.nameEn}
                    <button
                      type="button"
                      onClick={() => removeColor(i)}
                      className="grid size-5 place-items-center rounded-full hover:bg-border"
                      aria-label="Remove"
                    >
                      <X size={12} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
              <Plus size={14} className="text-muted" />
              {PALETTE.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  title={locale === "vi" ? c.nameVi : c.nameEn}
                  onClick={() => addColor({ nameVi: c.nameVi, nameEn: c.nameEn, hex: c.hex })}
                  className="size-6 rounded-full border border-foreground/20 transition-transform hover:scale-125"
                  style={{ background: c.hex }}
                />
              ))}
              <CustomColor onAdd={addColor} />
            </div>
          </div>
        </Label>

        <Label text={f("sizes")}>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SIZES.map((s) => {
              const on = v.sizes.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => set("sizes", on ? v.sizes.filter((x) => x !== s) : ALL_SIZES.filter((x) => x === s || v.sizes.includes(x)))}
                  className={cn("h-9 min-w-12 rounded-full border px-3 text-xs font-medium transition-colors", on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground", bad("sizes") && "border-danger")}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Label>

        <Label text={f("stockMatrix", { total })}>
          <div className={cn("overflow-x-auto rounded-xl border", bad("variants") ? "border-danger" : "border-border")}>
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-border bg-subtle/60 text-xs text-muted">
                  <th className="px-3 py-2 text-left font-medium">{f("colors")}</th>
                  {v.sizes.map((size) => (
                    <th key={size} className="px-2 py-2 font-medium">
                      {size}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-medium">Σ</th>
                </tr>
              </thead>
              <tbody>
                {v.colors.map((c) => {
                  const rowTotal = v.sizes.reduce((sum, size) => sum + stockAt(c.hex, size), 0);
                  return (
                    <tr key={c.hex} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-1.5">
                        <span className="flex items-center gap-2 text-xs whitespace-nowrap">
                          <span className="size-4 shrink-0 rounded-full border border-foreground/20" style={{ background: c.hex }} />
                          {locale === "vi" ? c.nameVi : c.nameEn}
                        </span>
                      </td>
                      {v.sizes.map((size) => {
                        const n = stockAt(c.hex, size);
                        return (
                          <td key={size} className="px-1 py-1.5 text-center">
                            <input
                              type="number"
                              min={0}
                              value={n}
                              onChange={(e) => setStockAt(c.hex, size, Number(e.target.value))}
                              aria-label={`${locale === "vi" ? c.nameVi : c.nameEn} ${size}`}
                              className={cn(
                                "h-9 w-16 rounded-lg border bg-card text-center text-sm tabular-nums outline-none focus:border-foreground",
                                n === 0 ? "border-danger/40 text-danger" : n <= 5 ? "border-amber-500/50" : "border-border",
                              )}
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5 text-right font-medium tabular-nums">{rowTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            {f("fillAll")}
            <input
              value={fillValue}
              onChange={(e) => setFillValue(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="h-8 w-16 rounded-lg border border-border bg-card px-2 text-center outline-none focus:border-foreground"
            />
            <button
              type="button"
              disabled={!fillValue}
              onClick={() => {
                const n = Number(fillValue);
                setStock((prev) => {
                  const next = { ...prev };
                  for (const c of v.colors) for (const size of v.sizes) next[variantKey(c.hex, size)] = n;
                  return next;
                });
              }}
              className="h-8 rounded-lg bg-subtle px-3 hover:bg-border disabled:opacity-40"
            >
              {f("apply")}
            </button>
          </div>
        </Label>

        <Label text={f("photos", { count: v.images.length })}>
          <ProductPhotos
            photos={v.images}
            colors={v.colors}
            invalid={bad("images")}
            onChange={(update) => setV((prev) => ({ ...prev, images: update(prev.images) }))}
          />
        </Label>

        <Label text={f("imageUrl")}>
          <input className={input("imageUrl")} value={v.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
        </Label>

        <div className="flex flex-wrap gap-6">
          <Check label={f("featured")} checked={v.featured} onChange={(c) => set("featured", c)} />
          <Check label={f("isNew")} checked={v.isNew} onChange={(c) => set("isNew", c)} />
        </div>
      </div>

      {/* Live preview */}
      <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">{f("preview")}</p>
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-3">
          <div className="aspect-[3/4] overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.div key={`${v.kind}-${preview.hex}-${previewPhoto}`} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative h-full w-full">
                <ProductImage kind={v.kind} color={preview.hex} imageUrl={previewPhoto} alt="" sizes="320px" />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-3 flex gap-1.5 px-1">
            {v.colors.map((c, i) => (
              <button type="button" key={c.hex} onClick={() => setPreviewIndex(i)} className={cn("size-4 rounded-full border border-foreground/20", i === previewIndex && "ring-1 ring-foreground ring-offset-2 ring-offset-card")} style={{ background: c.hex }} />
            ))}
          </div>
          <p className="mt-2 px-1 font-medium">{(locale === "vi" ? v.nameVi : v.nameEn) || "—"}</p>
          <Price price={Number(v.price) || 0} compareAtPrice={v.compareAtPrice} locale={locale} className="px-1 pb-1" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {pending ? t("saving") : t("save")}
          </Button>
          <Link href="/admin/products" className={buttonClasses({ variant: "secondary" })}>
            {t("cancel")}
          </Link>
        </div>
      </aside>
    </form>
  );
}

function Label({ text, children, className }: { text: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-sm text-muted">{text}</p>
      {children}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

function CustomColor({ onAdd }: { onAdd: (c: ProductColor) => void }) {
  const [hex, setHex] = useState("#7a8fa6");
  return (
    <span className="ml-1 flex items-center gap-1">
      <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Custom colour" />
      <button type="button" onClick={() => onAdd({ nameVi: hex, nameEn: hex, hex })} className="rounded-full bg-subtle px-2 py-0.5 text-[11px] hover:bg-border">
        +
      </button>
    </span>
  );
}
