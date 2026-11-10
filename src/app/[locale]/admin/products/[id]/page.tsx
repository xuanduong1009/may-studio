import { getTranslations, setRequestLocale } from "next-intl/server";
import { asLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories, getProductById } from "@/lib/queries";

export default async function EditProductPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: rawLocale, id } = await params;
  const locale = asLocale(rawLocale);
  setRequestLocale(locale);
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();
  const [t, categories, product] = await Promise.all([getTranslations("Admin"), getCategories(), getProductById(productId)]);
  if (!product) notFound();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{t("editProduct")}</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
