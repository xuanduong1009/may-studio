/** Catalogue reads: categories, product grids, shop search and the product page. */
import "server-only";
import { and, asc, count, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products, productVariants, type Product } from "@/lib/db/schema";
import { toStockMap, type StockMap } from "@/lib/inventory";
import { primaryPhoto } from "@/lib/photos/gallery";
import { PALETTE } from "@/lib/site";
import { searchText } from "@/lib/utils";

type CardBase = Pick<
  Product,
  | "id"
  | "slug"
  | "nameVi"
  | "nameEn"
  | "price"
  | "compareAtPrice"
  | "kind"
  | "colors"
  | "sizes"
  | "stock"
  | "isNew"
  | "rating"
  | "reviewCount"
  | "imageUrl"
  | "images"
>;

/** A product as shown in grids, with stock per colour x size for quick add. */
export type ProductCardData = CardBase & { stockMap: StockMap };

async function stockMaps(ids: number[]) {
  if (!ids.length) return new Map<number, StockMap>();
  const rows = await db.select().from(productVariants).where(inArray(productVariants.productId, ids));
  const grouped = new Map<number, typeof rows>();
  for (const r of rows) grouped.set(r.productId, [...(grouped.get(r.productId) ?? []), r]);
  return new Map([...grouped].map(([id, list]) => [id, toStockMap(list)]));
}

async function withStock<T extends CardBase>(cards: T[]): Promise<(T & { stockMap: StockMap })[]> {
  const maps = await stockMaps(cards.map((c) => c.id));
  return cards.map((c) => ({ ...c, stockMap: maps.get(c.id) ?? {} }));
}

const cardColumns = {
  id: products.id,
  slug: products.slug,
  nameVi: products.nameVi,
  nameEn: products.nameEn,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  kind: products.kind,
  colors: products.colors,
  sizes: products.sizes,
  stock: products.stock,
  isNew: products.isNew,
  rating: products.rating,
  reviewCount: products.reviewCount,
  imageUrl: products.imageUrl,
  images: products.images,
};

export async function getCategories() {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      nameVi: categories.nameVi,
      nameEn: categories.nameEn,
      kind: categories.kind,
      color: categories.color,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));
  return rows;
}

export async function getFeaturedProducts(limit = 8) {
  return withStock(await db.select(cardColumns).from(products).where(eq(products.featured, true)).orderBy(desc(products.sold)).limit(limit));
}

export async function getNewProducts(limit = 8) {
  return withStock(await db.select(cardColumns).from(products).where(eq(products.isNew, true)).orderBy(desc(products.createdAt)).limit(limit));
}

export async function getSaleProducts(limit = 10) {
  return withStock(
    await db
      .select(cardColumns)
      .from(products)
      .where(sql`${products.compareAtPrice} > ${products.price}`)
      .orderBy(desc(products.sold))
      .limit(limit),
  );
}

export type ShopFilters = {
  q?: string;
  category?: string;
  color?: string;
  size?: string;
  price?: string;
  sale?: string;
  new?: string;
  instock?: string;
  sort?: string;
};

/**
 * The catalogue is small, so filtering happens in memory after one query.
 * This keeps accent-insensitive search simple ("ao thun" matches "Áo thun").
 */
export async function searchProducts(f: ShopFilters) {
  const rows = await db
    .select({
      ...cardColumns,
      categorySlug: categories.slug,
      descriptionVi: products.descriptionVi,
      descriptionEn: products.descriptionEn,
      sold: products.sold,
      createdAt: products.createdAt,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id));

  const q = f.q ? searchText(f.q) : "";
  const colorHex = PALETTE.find((c) => c.key === f.color)?.hex.toLowerCase();

  let list = rows.filter((p) => {
    if (f.category && p.categorySlug !== f.category) return false;
    if (colorHex && !p.colors.some((c) => c.hex.toLowerCase() === colorHex)) return false;
    if (f.size && !p.sizes.includes(f.size)) return false;
    if (f.price === "under300" && p.price >= 300_000) return false;
    if (f.price === "300to600" && (p.price < 300_000 || p.price > 600_000)) return false;
    if (f.price === "over600" && p.price <= 600_000) return false;
    if (f.sale === "1" && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
    if (f.new === "1" && !p.isNew) return false;
    if (f.instock === "1" && p.stock <= 0) return false;
    if (q) {
      const haystack = searchText(`${p.nameVi} ${p.nameEn} ${p.descriptionVi} ${p.descriptionEn}`);
      if (!q.split(" ").every((word) => haystack.includes(word))) return false;
    }
    return true;
  });

  list = list.sort((a, b) => {
    switch (f.sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "popular":
        return b.sold - a.sold;
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  // drop the columns that were only needed for filtering and sorting
  const cards: CardBase[] = list.map(({ categorySlug: _c, descriptionVi: _dv, descriptionEn: _de, sold: _s, createdAt: _t, ...card }) => card);
  return withStock(cards);
}

/** Instant search: a few products plus matching categories. */
export async function searchSuggestions(q: string) {
  const [items, cats] = await Promise.all([searchProducts({ q, sort: "popular" }), getCategories()]);
  const needle = searchText(q);
  return {
    products: items.slice(0, 6).map((p) => ({
      id: p.id,
      slug: p.slug,
      nameVi: p.nameVi,
      nameEn: p.nameEn,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      kind: p.kind,
      color: p.colors[0]?.hex ?? "#cccccc",
      imageUrl: p.imageUrl ?? primaryPhoto(p.images, p.colors[0]?.hex),
    })),
    total: items.length,
    categories: cats
      .filter((c) => needle && searchText(`${c.nameVi} ${c.nameEn}`).includes(needle))
      .map((c) => ({ slug: c.slug, nameVi: c.nameVi, nameEn: c.nameEn })),
  };
}

export async function getProductBySlug(slug: string) {
  const [row] = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  if (!row) return null;
  const maps = await stockMaps([row.product.id]);
  return { ...row, stockMap: maps.get(row.product.id) ?? {} };
}

export async function getRelatedProducts(productId: number, categoryId: number, limit = 4) {
  const same = await db
    .select(cardColumns)
    .from(products)
    .where(and(eq(products.categoryId, categoryId), ne(products.id, productId)))
    .orderBy(desc(products.sold))
    .limit(limit);
  if (same.length >= limit) return withStock(same);
  const exclude = [productId, ...same.map((p) => p.id)];
  const more = await db
    .select(cardColumns)
    .from(products)
    .where(sql`${products.id} not in (${sql.join(exclude.map((id) => sql`${id}`), sql`, `)})`)
    .orderBy(desc(products.sold))
    .limit(limit - same.length);
  return withStock([...same, ...more]);
}

/** "Complete the look": best sellers from other categories, one per category, rotated by product id. */
export async function getCompleteTheLook(productId: number, categoryId: number, limit = 4) {
  const rows = await db
    .select({ ...cardColumns, categoryId: products.categoryId })
    .from(products)
    .where(and(ne(products.categoryId, categoryId), gte(products.stock, 1)))
    .orderBy(desc(products.sold));
  const byCategory = new Map<number, typeof rows>();
  for (const r of rows) byCategory.set(r.categoryId, [...(byCategory.get(r.categoryId) ?? []), r]);
  const picks = [...byCategory.values()].map((list) => list[productId % list.length]);
  const offset = productId % Math.max(1, picks.length);
  const rotated = [...picks.slice(offset), ...picks.slice(0, offset)].slice(0, limit);
  return withStock(rotated.map(({ categoryId: _c, ...card }) => card));
}

export async function getAllProductSlugs() {
  return db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products);
}

export async function getProductsBySlugs(slugs: string[]) {
  if (!slugs.length) return [];
  return db.select(cardColumns).from(products).where(inArray(products.slug, slugs));
}
