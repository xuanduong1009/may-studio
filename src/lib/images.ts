/** Helpers for product photos uploaded from the admin (pure, so they are unit-tested). */

/** Upper bound for one stored photo. The admin shrinks photos in the browser well below this. */
export const MAX_IMAGE_BYTES = 3_500_000;

/** Uploaded photos are served from here: /api/images/<16-character id>. */
export const IMAGE_ROUTE = "/api/images/";

const ID = /^[A-Za-z0-9_-]{16}$/;

export function isImageId(id: string) {
  return ID.test(id);
}

/** The upload id inside a photo URL, or null for any other URL. */
export function imageIdFromUrl(url: string | null | undefined) {
  if (!url?.startsWith(IMAGE_ROUTE)) return null;
  const id = url.slice(IMAGE_ROUTE.length);
  return isImageId(id) ? id : null;
}

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));

/**
 * Detects JPEG, PNG and WebP from their first bytes. The type the browser
 * sends is not trusted, and nothing else (SVG, HTML…) is ever stored or served.
 */
export function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  return null;
}
