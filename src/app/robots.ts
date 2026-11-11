import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // product photos uploaded from the admin live under /api/images/ and should be indexable
    rules: { userAgent: "*", allow: ["/", "/api/images/"], disallow: ["/admin", "/en/admin", "/account", "/en/account", "/checkout", "/en/checkout", "/api"] },
    sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
