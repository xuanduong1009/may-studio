import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/server/queries/catalog";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, "");
  const both = (path: string) => ({
    url: `${base}${path || "/"}`,
    alternates: { languages: { vi: `${base}${path || "/"}`, en: `${base}/en${path}` } },
  });

  const products = await getAllProductSlugs();
  return [
    { ...both(""), changeFrequency: "daily", priority: 1 },
    { ...both("/shop"), changeFrequency: "daily", priority: 0.9 },
    { ...both("/about"), changeFrequency: "monthly", priority: 0.5 },
    { ...both("/help"), changeFrequency: "monthly", priority: 0.5 },
    ...products.map((p) => ({ ...both(`/product/${p.slug}`), lastModified: p.updatedAt, priority: 0.7 })),
  ];
}
