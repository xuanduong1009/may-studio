"use client";

import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { uploadProductImage } from "@/app/actions/admin";
import { ProductImage } from "@/components/product/product-image";
import type { ProductColor, ProductPhoto } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const MAX_SIDE = 1600;

/** Shrinks a photo in the browser (longest side 1600 px, WebP or JPEG) so uploads stay small and fast. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  // Safari cannot encode WebP (it silently returns PNG), so fall back to JPEG
  const webp = await encode("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg");
  if (!jpeg) throw new Error("encode");
  return jpeg;
}

type Update = (prev: ProductPhoto[]) => ProductPhoto[];

/** Gallery editor for the product form: upload, assign a colour, reorder, remove. */
export function ProductPhotos({
  photos,
  colors,
  invalid,
  onChange,
}: {
  photos: ProductPhoto[];
  colors: ProductColor[];
  invalid?: boolean;
  onChange: (update: Update) => void;
}) {
  const t = useTranslations("Admin");
  const f = useTranslations("Admin.fields");
  const locale = useLocale();
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(0);
  const [dragging, setDragging] = useState(false);

  const colorName = (c: ProductColor) => (locale === "vi" ? c.nameVi : c.nameEn);
  const colorOf = (hex: string | null) => colors.find((c) => c.hex.toLowerCase() === hex?.toLowerCase());
  // new uploads go to the chosen colour (if it still exists)
  const targetHex = colorOf(target) ? target : null;

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!list.length) return;
    const colorHex = targetHex;
    setBusy((n) => n + list.length);
    for (const file of list) {
      try {
        const blob = await compress(file);
        const body = new FormData();
        body.append("file", blob, blob.type === "image/webp" ? "photo.webp" : "photo.jpg");
        const res = await uploadProductImage(body);
        if (res.ok) onChange((prev) => [...prev, { url: res.url, colorHex }]);
        else toast.error(res.error === "readonly" ? t("readonly") : res.error === "tooLarge" ? f("photoTooLarge") : f("photoFailed"));
      } catch {
        toast.error(f("photoUnsupported", { name: file.name }));
      } finally {
        setBusy((n) => n - 1);
      }
    }
  }

  const move = (from: number, to: number) =>
    onChange((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  return (
    <div
      className={cn("rounded-xl border p-3 transition-colors", invalid ? "border-danger" : dragging ? "border-foreground bg-subtle/60" : "border-border")}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void upload(e.dataTransfer.files);
      }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <p className="max-w-md">{f("photosHint")}</p>
        {colors.length > 1 ? (
          <label className="flex items-center gap-2">
            {f("newPhotosFor")}
            <select value={targetHex ?? ""} onChange={(e) => setTarget(e.target.value)} className="h-8 rounded-lg border border-border bg-card px-2 text-xs text-foreground outline-none focus:border-foreground">
              <option value="">{f("allColors")}</option>
              {colors.map((c) => (
                <option key={c.hex} value={c.hex.toLowerCase()}>
                  {colorName(c)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <AnimatePresence initial={false}>
          {photos.map((p, i) => {
            const color = colorOf(p.colorHex);
            return (
              <motion.li key={p.url} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="min-w-0">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-subtle">
                  <ProductImage kind="tee" color={color?.hex ?? "#d9cbb5"} imageUrl={p.url} alt="" sizes="160px" toned={false} />
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => onChange((prev) => prev.filter((x) => x.url !== p.url))}
                    aria-label={f("removePhoto")}
                    title={f("removePhoto")}
                    className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-background/90 hover:bg-danger hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={f("moveLeft")} title={f("moveLeft")} className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-subtle disabled:opacity-30">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="size-3 shrink-0 rounded-full border border-foreground/20" style={{ background: color?.hex ?? "conic-gradient(#d8a7a1,#a3b19b,#9cc3e0,#cdb48e,#d8a7a1)" }} />
                  <select
                    value={color ? p.colorHex!.toLowerCase() : ""}
                    onChange={(e) => onChange((prev) => prev.map((x) => (x.url === p.url ? { ...x, colorHex: e.target.value || null } : x)))}
                    aria-label={f("photoColor")}
                    className="h-7 min-w-0 flex-1 rounded-md bg-transparent text-[11px] outline-none"
                  >
                    <option value="">{f("allColors")}</option>
                    {colors.map((c) => (
                      <option key={c.hex} value={c.hex.toLowerCase()}>
                        {colorName(c)}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label={f("moveRight")} title={f("moveRight")} className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-subtle disabled:opacity-30">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>

        <li>
          <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-2 text-center text-xs text-muted transition-colors focus-within:border-foreground hover:border-foreground hover:text-foreground">
            {busy ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
            <span>{busy ? f("uploading", { count: busy }) : f("dropPhotos")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              multiple
              className="sr-only"
              aria-label={f("addPhotos")}
              onChange={(e) => {
                if (e.target.files) void upload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </li>
      </ul>
    </div>
  );
}
