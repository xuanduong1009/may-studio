import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/server/queries/catalog";

/** Product data for the quick-view modal. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getProductBySlug(slug.slice(0, 120));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const p = row.product;
  return NextResponse.json(
    {
      id: p.id,
      slug: p.slug,
      nameVi: p.nameVi,
      nameEn: p.nameEn,
      descriptionVi: p.descriptionVi,
      descriptionEn: p.descriptionEn,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      kind: p.kind,
      colors: p.colors,
      sizes: p.sizes,
      stock: p.stock,
      isNew: p.isNew,
      rating: p.rating,
      reviewCount: p.reviewCount,
      imageUrl: p.imageUrl,
      images: p.images,
      stockMap: row.stockMap,
    },
    { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" } },
  );
}
