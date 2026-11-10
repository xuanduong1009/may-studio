import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Web app manifest: lets shoppers add the store to their home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: "Thời trang tối giản, nhẹ như mây.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#1c1b19",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
