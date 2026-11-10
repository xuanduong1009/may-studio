/**
 * Editorial photography (free Pexels licence, see docs/CREDITS.md).
 * Product cards keep their recolourable illustrations; photos set the mood.
 */
const base = "/images/editorial";

export const EDITORIAL = {
  heroMain: `${base}/hero-main.jpg`,
  heroSecond: `${base}/hero-second.jpg`,
  newsletter: `${base}/newsletter.jpg`,
  aboutAtelier: `${base}/about-atelier.jpg`,
  process: [`${base}/about-sketch.jpg`, `${base}/about-fabric.jpg`, `${base}/about-sewing.jpg`, `${base}/about-packing.jpg`],
  stores: [`${base}/store-hcm.jpg`, `${base}/store-hn.jpg`],
  looks: [`${base}/look-friday.jpg`, `${base}/look-rain.jpg`, `${base}/look-morning.jpg`, `${base}/look-weekend.jpg`],
} as const;

const CATEGORY_PHOTOS: Record<string, string> = {
  "ao-thun": `${base}/cat-ao-thun.jpg`,
  "so-mi": `${base}/cat-so-mi.jpg`,
  hoodie: `${base}/cat-hoodie.jpg`,
  "ao-khoac": `${base}/cat-ao-khoac.jpg`,
  quan: `${base}/cat-quan.jpg`,
  "vay-dam": `${base}/cat-vay-dam.jpg`,
  "chan-vay": `${base}/cat-chan-vay.jpg`,
  "phu-kien": `${base}/cat-phu-kien.jpg`,
};

/** Mood photo for a category (falls back to the hero image). */
export function categoryPhoto(slug: string) {
  return CATEGORY_PHOTOS[slug] ?? EDITORIAL.heroMain;
}
