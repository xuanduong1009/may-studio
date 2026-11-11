import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/routing";
import { Suspense } from "react";
import { ProductGrid } from "@/components/shop/product-grid";
import { ActiveFilters, CategoryChips, DensityToggle } from "@/components/shop/shop-toolbar";
import { FilterSheet, FilterSidebar, SortSelect } from "@/components/shop/shop-filters";
import { getCategories, searchProducts, type ShopFilters as Filters } from "@/lib/server/queries/catalog";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("Shop");
  const sp = await searchParams;
  return { title: one(sp.sale) ? t("titleSale") : one(sp.new) ? t("titleNew") : t("title") };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Shop");
  const sp = await searchParams;

  const filters: Filters = {
    q: one(sp.q),
    category: one(sp.category),
    color: one(sp.color),
    size: one(sp.size),
    price: one(sp.price),
    sale: one(sp.sale),
    new: one(sp.new),
    instock: one(sp.instock),
    sort: one(sp.sort),
  };

  const [categories, products] = await Promise.all([getCategories(), searchProducts(filters)]);
  const category = categories.find((c) => c.slug === filters.category);

  const title = filters.q
    ? t("searchFor", { q: filters.q })
    : category
      ? locale === "vi"
        ? category.nameVi
        : category.nameEn
      : filters.sale
        ? t("titleSale")
        : filters.new
          ? t("titleNew")
          : t("title");

  return (
    <div className="container-x pt-36 pb-12">
      <header className="mb-8 flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs tracking-[0.3em] text-muted uppercase">MÂY Studio</p>
          <h1 className="font-display text-5xl sm:text-6xl">{title}</h1>
          <p className="mt-2 text-sm text-muted">{t("results", { count: products.length })}</p>
        </div>
        <Suspense>
          <div className="flex items-center gap-2">
            <FilterSheet categories={categories} count={products.length} />
            <DensityToggle />
            <SortSelect />
          </div>
        </Suspense>
      </header>

      <Suspense>
        <CategoryChips categories={categories} />
      </Suspense>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <Suspense>
          <FilterSidebar categories={categories} />
          <div className="min-w-0">
            <ActiveFilters />
            <ProductGrid products={products} />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
