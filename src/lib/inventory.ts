/** Stock per colour × size, keyed "hex|size" (hex lower-cased). */
export type StockMap = Record<string, number>;

export const LOW_STOCK_THRESHOLD = 5;

export function variantKey(hex: string, size: string) {
  return `${hex.toLowerCase()}|${size}`;
}

export function stockOf(map: StockMap, hex: string, size: string) {
  return map[variantKey(hex, size)] ?? 0;
}

/** Total stock of one colour across its sizes. */
export function colorStock(map: StockMap, hex: string, sizes: string[]) {
  return sizes.reduce((sum, s) => sum + stockOf(map, hex, s), 0);
}

export function toStockMap(rows: { colorHex: string; size: string; stock: number }[]): StockMap {
  const map: StockMap = {};
  for (const r of rows) map[variantKey(r.colorHex, r.size)] = r.stock;
  return map;
}

export function totalStock(map: StockMap) {
  return Object.values(map).reduce((a, b) => a + b, 0);
}
