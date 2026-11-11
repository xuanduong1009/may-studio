/**
 * Editorial photography (free Pexels licence, see docs/CREDITS.md): the mood
 * photos of the home page, the story page and the category menus.
 */
const base = "/images/editorial";
const pexels = (id: number) => `/images/pexels/${id}.jpg`;

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

/* ------------------------------------------------------------------ */
/* Home page sections                                                  */
/* ------------------------------------------------------------------ */

/** "Shop the look": outfit photos and where each product sits on them (% of the photo). */
export const HOME_LOOKS = [
  {
    photo: pexels(18173600),
    spots: [
      { slug: "blazer-linen", color: "cream", x: 34, y: 47 },
      { slug: "quan-ong-suong-linen", color: "sand", x: 58, y: 74 },
    ],
  },
  {
    photo: pexels(9558927),
    spots: [
      { slug: "mu-luoi-trai", color: "white", x: 46, y: 41 },
      { slug: "ao-thun-co-tron-basic", color: "white", x: 60, y: 70 },
      { slug: "quan-kaki-dang-dung", color: "sand", x: 55, y: 89 },
    ],
  },
] as const;

/** Full-screen campaign panels; their headlines are the "Home.campaign" translations, in the same order. */
export const HOME_CAMPAIGN = [
  { src: pexels(5120189), href: "/shop?category=ao-khoac", position: "50% 45%" },
  { src: pexels(30251203), href: "/shop?category=vay-dam", position: "50% 55%" },
  { src: pexels(19747454), href: "/shop?new=1", position: "50% 60%" },
  { src: pexels(28036390), href: "/shop", position: "50% 40%" },
];

/** Gallery wall: photo, its size (for the masonry layout) and a like count. */
export const HOME_GALLERY: { src: string; w: number; h: number; likes: number }[] = [
  { src: pexels(21620267), w: 1200, h: 1600, likes: 4821 },
  { src: pexels(8343181), w: 1200, h: 800, likes: 2140 },
  { src: pexels(7956307), w: 1200, h: 2133, likes: 6302 },
  { src: pexels(21904524), w: 1200, h: 1800, likes: 3987 },
  { src: pexels(28232666), w: 1200, h: 1800, likes: 5210 },
  { src: pexels(9467305), w: 1200, h: 1553, likes: 1876 },
  { src: pexels(19357654), w: 1200, h: 1500, likes: 2655 },
  { src: pexels(8360771), w: 1200, h: 1800, likes: 3120 },
  { src: pexels(7100132), w: 1200, h: 1800, likes: 2789 },
  { src: pexels(348274), w: 1200, h: 1800, likes: 4410 },
  { src: pexels(17776995), w: 1200, h: 2132, likes: 3302 },
  { src: pexels(18269866), w: 1200, h: 1800, likes: 2957 },
];
