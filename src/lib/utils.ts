import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number, locale: string = "vi") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | number | string, locale: string = "vi", withTime = false) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date));
}

/** Pick the right translation from a bilingual record. */
export function tr<T extends Record<string, unknown>>(obj: T, field: string, locale: string): string {
  const key = `${field}${locale === "vi" ? "Vi" : "En"}`;
  return String(obj[key] ?? obj[`${field}Vi`] ?? "");
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for HTML that is built by hand (emails). */
export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** Lower-case, accent-free words for searching: "Áo thun Đen" → "ao thun den". */
export function searchText(input: string) {
  return slugify(input).replace(/-/g, " ");
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
