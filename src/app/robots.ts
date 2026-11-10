import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/en/admin", "/account", "/en/account", "/checkout", "/en/checkout", "/api"] },
    sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
