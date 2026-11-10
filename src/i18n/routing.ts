import { hasLocale } from "next-intl";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  // "/" is Vietnamese, "/en" is English
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];

/** Narrow a route param to a supported locale (falls back to the default). */
export function asLocale(value: string): AppLocale {
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}
