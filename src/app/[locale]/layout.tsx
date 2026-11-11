import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { IntroGate } from "@/components/layout/intro";
import { MobileTabBar } from "@/components/layout/mobile-tabbar";
import { QuickView } from "@/components/product/quick-view";
import { Cursor } from "@/components/ui/cursor";
import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import { getCategories } from "@/lib/server/queries/catalog";
import { site } from "@/lib/site";
import "../globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const display = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#12110f" },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "vi" | "en", namespace: "Meta" });
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s · ${site.name}` },
    description: t("description"),
    alternates: { languages: { vi: "/", en: "/en" } },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: t("title"),
      description: t("description"),
      locale: locale === "vi" ? "vi_VN" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const categories = (await getCategories()).map((c) => ({
    slug: c.slug,
    nameVi: c.nameVi,
    nameEn: c.nameEn,
    kind: c.kind,
    color: c.color,
    productCount: c.productCount,
  }));

  return (
    <html lang={locale} suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <head>
        {/* skip the intro for returning visitors and for "reduce motion", before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("may-intro")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="done"}catch(e){document.documentElement.dataset.intro="done"}`,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <Providers>
            <a
              href="#main"
              className="fixed top-2 left-2 z-[100] -translate-y-20 rounded-full bg-foreground px-4 py-2 text-sm text-background focus:translate-y-0"
            >
              Skip to content
            </a>
            <IntroGate />
            <Header categories={categories} />
            <main id="main">{children}</main>
            <Footer />
            <CartDrawer />
            <QuickView />
            <MobileTabBar />
            <Cursor />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
