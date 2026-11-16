import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetail } from "@/components/product/product-detail";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { ProductReviews } from "@/components/product/reviews";
import { Reveal, RevealText } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { getCompleteTheLook, getProductBySlug, getRelatedProducts } from "@/lib/server/queries/catalog";
import { getProductReviews, getReviewEligibility } from "@/lib/server/queries/reviews";
import { getSession } from "@/lib/server/session";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const row = await getProductBySlug(slug);
  if (!row) return {};
  const p = row.product;
  const name = locale === "vi" ? p.nameVi : p.nameEn;
  const description = locale === "vi" ? p.descriptionVi : p.descriptionEn;
  return {
    title: name,
    description,
    openGraph: { title: name, description, images: p.imageUrl ? [p.imageUrl] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { locale: rawLocale, slug } = await params;
  const locale = asLocale(rawLocale);
  setRequestLocale(locale);
  const row = await getProductBySlug(slug);
  if (!row) notFound();

  const { product, category, stockMap } = row;
  const session = await getSession();
  const [t, nav, related, reviewData, eligibility, pairs] = await Promise.all([
    getTranslations("Product"),
    getTranslations("Nav"),
    getRelatedProducts(product.id, product.categoryId),
    getProductReviews(product.id),
    getReviewEligibility(session?.user.id, product.id),
    getCompleteTheLook(product.id, product.categoryId),
  ]);
  const name = locale === "vi" ? product.nameVi : product.nameEn;

  // Structured data so search engines can show price, stock and rating
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: locale === "vi" ? product.descriptionVi : product.descriptionEn,
    sku: `MAY-${product.id}`,
    brand: { "@type": "Brand", name: site.name },
    image: (product.images.length ? product.images.map((p) => `${site.url}${p.url}`) : product.imageUrl) ?? undefined,
    aggregateRating: product.reviewCount
      ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount }
      : undefined,
    review: reviewData.list.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      datePublished: r.createdAt.toISOString().slice(0, 10),
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.body,
    })),
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site.url}${locale === "vi" ? "" : "/en"}/product/${product.slug}`,
    },
  };

  return (
    <div className="container-x pt-32 pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          {nav("home")}
        </Link>
        <ChevronRight size={14} />
        <Link href={`/shop?category=${category.slug}`} className="hover:text-foreground">
          {locale === "vi" ? category.nameVi : category.nameEn}
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground">{name}</span>
      </nav>

      <ProductDetail
        product={{
          id: product.id,
          slug: product.slug,
          nameVi: product.nameVi,
          nameEn: product.nameEn,
          descriptionVi: product.descriptionVi,
          descriptionEn: product.descriptionEn,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          kind: product.kind,
          colors: product.colors,
          sizes: product.sizes,
          stock: product.stock,
          isNew: product.isNew,
          rating: product.rating,
          reviewCount: product.reviewCount,
          imageUrl: product.imageUrl,
          images: product.images,
          stockMap,
        }}
      />

      {pairs.length ? (
        <section className="mt-28 rounded-[2rem] bg-subtle/60 px-4 py-12 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <RevealText text={t("completeLook")} className="font-display text-4xl sm:text-5xl" />
              <p className="mt-2 text-muted">{t("completeLookHint")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {pairs.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <ProductReviews
        productId={product.id}
        slug={product.slug}
        rating={product.rating}
        reviewCount={product.reviewCount}
        data={reviewData}
        eligibility={eligibility}
      />

      {related.length ? (
        <section className="mt-32">
          <RevealText text={t("related")} className="mb-10 font-display text-4xl sm:text-5xl" />
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}
