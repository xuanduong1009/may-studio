/** Store-wide configuration. Change the brand here. */
export const site = {
  name: "MÂY Studio",
  shortName: "MÂY",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hello@may.studio",
  phone: "0900 000 000",
  address: "Quận 3, TP. Hồ Chí Minh",
  socials: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
  },
} as const;

/** Colour palette used by products — also powers the colour filter in the shop. */
export const PALETTE = [
  { key: "black", nameVi: "Đen", nameEn: "Black", hex: "#1c1c1c" },
  { key: "white", nameVi: "Trắng", nameEn: "White", hex: "#f5f3ee" },
  { key: "cream", nameVi: "Kem", nameEn: "Cream", hex: "#ece0c8" },
  { key: "sand", nameVi: "Be cát", nameEn: "Sand", hex: "#cdb48e" },
  { key: "brown", nameVi: "Nâu", nameEn: "Brown", hex: "#7a5236" },
  { key: "olive", nameVi: "Xanh ô liu", nameEn: "Olive", hex: "#6b6b3a" },
  { key: "sage", nameVi: "Xanh xô thơm", nameEn: "Sage", hex: "#a3b19b" },
  { key: "navy", nameVi: "Xanh navy", nameEn: "Navy", hex: "#22304a" },
  { key: "sky", nameVi: "Xanh trời", nameEn: "Sky", hex: "#9cc3e0" },
  { key: "grey", nameVi: "Xám", nameEn: "Grey", hex: "#8d8d8d" },
  { key: "rose", nameVi: "Hồng đất", nameEn: "Rose", hex: "#d8a7a1" },
  { key: "terracotta", nameVi: "Đỏ gạch", nameEn: "Terracotta", hex: "#b65a3c" },
  { key: "denim", nameVi: "Xanh denim", nameEn: "Denim", hex: "#6f8fb3" },
  { key: "emerald", nameVi: "Xanh ngọc", nameEn: "Emerald", hex: "#1f5e4a" },
  { key: "butter", nameVi: "Vàng bơ", nameEn: "Butter", hex: "#e9d9a6" },
  { key: "taupe", nameVi: "Nâu xám", nameEn: "Taupe", hex: "#a39283" },
  { key: "red", nameVi: "Đỏ", nameEn: "Red", hex: "#b3262e" },
] as const;

export type PaletteKey = (typeof PALETTE)[number]["key"];

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "FREE"] as const;

export const SIZE_GUIDE = [
  { size: "XS", chest: "78–82", waist: "60–64", height: "150–155" },
  { size: "S", chest: "82–86", waist: "64–68", height: "155–160" },
  { size: "M", chest: "86–92", waist: "68–74", height: "160–168" },
  { size: "L", chest: "92–98", waist: "74–80", height: "168–175" },
  { size: "XL", chest: "98–104", waist: "80–86", height: "175–182" },
];

/** The 34 provinces and cities of Vietnam (after the July 2025 merger), big cities first. */
export const CITIES = [
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Huế",
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Tĩnh",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
];

/** Flash sale ends at the next Sunday 23:59 (Vietnam time) — recomputed every week. */
export function nextSaleEnd(now = new Date()) {
  const vn = new Date(now.getTime() + 7 * 3600_000);
  const day = vn.getUTCDay(); // 0 = Sunday
  const daysLeft = (7 - day) % 7;
  const end = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() + daysLeft, 23, 59, 59);
  return new Date(end - 7 * 3600_000);
}
