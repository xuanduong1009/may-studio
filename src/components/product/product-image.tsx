import Image from "next/image";
import { cn } from "@/lib/utils";
import { GarmentArt, type GarmentView } from "./garment-art";

/**
 * Shows the product photo when there is one (optimised by next/image for
 * local files), otherwise the generated vector artwork in the selected colour.
 */
export function ProductImage({
  kind,
  color,
  imageUrl,
  view = "front",
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
  toned = true,
}: {
  kind: string;
  color: string;
  imageUrl?: string | null;
  view?: GarmentView;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /**
   * Art direction for catalogue shots: the photo is multiplied onto one warm
   * backdrop, so white and grey studio backgrounds from different shoots all
   * read as the same seamless paper (light theme only).
   */
  toned?: boolean;
}) {
  if (imageUrl && imageUrl.startsWith("/")) {
    return (
      <span className={cn("relative block h-full w-full", toned && "bg-[#efe8dd] dark:bg-transparent")}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", toned && "mix-blend-multiply saturate-[.92] dark:mix-blend-normal dark:saturate-100", className)}
        />
      </span>
    );
  }
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-provided URLs
      <img src={imageUrl} alt={alt} className={cn("h-full w-full object-cover", className)} loading="lazy" />
    );
  }
  return <GarmentArt kind={kind} color={color} view={view} title={alt} className={cn("h-full w-full", className)} />;
}
