import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductForm } from "@/components/admin/product-form";
import { asLocale } from "@/i18n/routing";
import { getCategories } from "@/lib/server/queries/catalog";

export default async function NewProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const [t, categories] = await Promise.all([getTranslations("Admin"), getCategories()]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{t("newProduct")}</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
