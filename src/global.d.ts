import type messages from "../messages/vi.json";
import type { routing } from "./i18n/routing";

// Type-safe translation keys: t("Home.titleA") is checked at compile time.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
