import "server-only";
import { inArray, like, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, productImages, products } from "@/lib/db/schema";
import { IMAGE_ROUTE, imageIdFromUrl } from "@/lib/images";

/**
 * Deletes uploaded photos that no product and no past order uses any more
 * (removed from a gallery, product deleted, or uploaded and never saved).
 * Uploads younger than an hour are kept, since a form may still be open.
 */
export async function pruneUnusedImages() {
  const cutoff = new Date(Date.now() - 3_600_000);
  const candidates = await db.select({ id: productImages.id }).from(productImages).where(lt(productImages.createdAt, cutoff));
  if (!candidates.length) return;

  const used = new Set<string>();
  const keep = (url: string | null | undefined) => {
    const id = imageIdFromUrl(url);
    if (id) used.add(id);
  };
  for (const p of await db.select({ imageUrl: products.imageUrl, images: products.images }).from(products)) {
    keep(p.imageUrl);
    for (const photo of p.images) keep(photo.url);
  }
  // orders keep a snapshot of the photo that was bought
  const ordered = await db
    .selectDistinct({ imageUrl: orderItems.imageUrl })
    .from(orderItems)
    .where(like(orderItems.imageUrl, `${IMAGE_ROUTE}%`));
  for (const it of ordered) keep(it.imageUrl);

  const unused = candidates.map((c) => c.id).filter((id) => !used.has(id));
  if (unused.length) await db.delete(productImages).where(inArray(productImages.id, unused));
}
