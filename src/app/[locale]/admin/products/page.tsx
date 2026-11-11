import { Pencil, Plus, Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductImage } from "@/components/product/product-image";
import { buttonClasses } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { primaryPhoto } from "@/lib/photos/gallery";
import { getAdminProducts } from "@/lib/server/queries/admin";
import { cn, formatPrice } from "@/lib/utils";

export default async function AdminProducts({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const { q } = await searchParams;
  const [t, rows] = await Promise.all([getTranslations("Admin"), getAdminProducts(q)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">
          {t("products")} <span className="text-xl text-muted">({rows.length})</span>
        </h1>
        <Link href="/admin/products/new" className={buttonClasses()}>
          <Plus size={16} /> {t("newProduct")}
        </Link>
      </div>

      <form className="relative max-w-sm">
        <Search size={16} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} placeholder={t("search")} className="h-11 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm outline-none focus:border-foreground" />
      </form>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-5 py-3 font-medium">{t("table.product")}</th>
              <th className="px-5 py-3 font-medium">{t("table.category")}</th>
              <th className="px-5 py-3 font-medium">{t("table.price")}</th>
              <th className="px-5 py-3 font-medium">{t("table.stock")}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product: p, categoryVi, categoryEn }) => (
              <tr key={p.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-subtle/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg">
                      <ProductImage kind={p.kind} color={p.colors[0]?.hex ?? "#ccc"} imageUrl={primaryPhoto(p.images, p.colors[0]?.hex) ?? p.imageUrl} alt="" sizes="48px" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/product/${p.slug}`} className="block truncate font-medium hover:underline">
                        {locale === "vi" ? p.nameVi : p.nameEn}
                      </Link>
                      <div className="mt-1 flex gap-1">
                        {p.colors.map((c) => (
                          <span key={c.hex} className="size-3 rounded-full border border-foreground/20" style={{ background: c.hex }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted">{locale === "vi" ? categoryVi : categoryEn}</td>
                <td className="px-5 py-3 tabular-nums">
                  {formatPrice(p.price, locale)}
                  {p.compareAtPrice ? <span className="ml-2 text-xs text-muted line-through">{formatPrice(p.compareAtPrice, locale)}</span> : null}
                </td>
                <td className="px-5 py-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium tabular-nums", p.stock === 0 ? "bg-danger/15 text-danger" : p.stock <= 5 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-subtle")}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/products/${p.id}`} className="grid size-9 place-items-center rounded-full hover:bg-subtle" aria-label={t("edit")} title={t("edit")}>
                      <Pencil size={15} />
                    </Link>
                    <DeleteProductButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
