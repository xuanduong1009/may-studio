import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productImages } from "@/lib/db/schema";
import { isImageId } from "@/lib/images";

/** Product photos uploaded from the admin. An id never changes content, so browsers and the CDN keep it for a year. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isImageId(id)) return new Response("Not found", { status: 404 });
  const [row] = await db
    .select({ mime: productImages.mime, data: productImages.data })
    .from(productImages)
    .where(eq(productImages.id, id))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.data.length),
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
