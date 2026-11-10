import type { ProductPhoto } from "@/lib/db/schema";

/** Photos to show for a colour: its own first, then shared ones; other colours only as a last resort. */
export function photosForColor(images: ProductPhoto[] | null | undefined, hex: string | null | undefined) {
  if (!images?.length) return [];
  const h = (hex ?? "").toLowerCase();
  const own = images.filter((p) => p.colorHex?.toLowerCase() === h);
  const shared = images.filter((p) => !p.colorHex);
  if (own.length || shared.length) return [...own, ...shared];
  return images;
}

export function primaryPhoto(images: ProductPhoto[] | null | undefined, hex: string | null | undefined) {
  return photosForColor(images, hex)[0]?.url ?? null;
}
