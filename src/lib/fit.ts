/** Size recommendation from height, weight and fit preference (pure, unit-tested). */

export type FitPreference = "slim" | "regular" | "loose";
export type FitProfile = { height: number; weight: number; fit: FitPreference };

export const SIZE_ORDER = ["XS", "S", "M", "L", "XL"] as const;

/** Index into SIZE_ORDER suggested by height alone (matches the size guide table). */
function byHeight(cm: number) {
  return cm < 155 ? 0 : cm < 160 ? 1 : cm < 168 ? 2 : cm < 175 ? 3 : 4;
}

function byWeight(kg: number) {
  return kg < 47 ? 0 : kg < 54 ? 1 : kg < 63 ? 2 : kg < 73 ? 3 : 4;
}

export function recommendSize(profile: FitProfile, sizes: readonly string[]): { size: string; exact: boolean } | null {
  if (sizes.length === 1 && sizes[0] === "FREE") return { size: "FREE", exact: true };
  const h = byHeight(profile.height);
  const w = byWeight(profile.weight);
  const avg = (h + w) / 2;
  // between two sizes: slim rounds down, regular rounds up, loose goes one size up
  let idx = profile.fit === "slim" ? Math.floor(avg) : profile.fit === "loose" ? Math.ceil(avg) + 1 : Math.ceil(avg);
  idx = Math.max(0, Math.min(SIZE_ORDER.length - 1, idx));

  const available = sizes.map((s) => SIZE_ORDER.indexOf(s as (typeof SIZE_ORDER)[number])).filter((i) => i >= 0);
  if (!available.length) return null;
  // closest size the product is made in; on a tie prefer the larger one
  const best = available.reduce((a, b) => {
    const da = Math.abs(a - idx);
    const db = Math.abs(b - idx);
    return db < da || (db === da && b > a) ? b : a;
  });
  return { size: SIZE_ORDER[best], exact: best === idx };
}
