/** Small colour helpers used by the generated product artwork. */

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, n));
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Mix a colour towards white (amount > 0) or black (amount < 0). amount in [-1, 1]. */
export function shade(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex);
  const target = amount >= 0 ? 255 : 0;
  const a = Math.abs(amount);
  return rgbToHex(r + (target - r) * a, g + (target - g) * a, b + (target - b) * a);
}

/** Relative luminance (0 = black, 1 = white). */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isLight(hex: string) {
  return luminance(hex) > 0.6;
}
