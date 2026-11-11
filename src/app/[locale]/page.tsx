import { ArrowRight, Leaf, RotateCcw, Truck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Campaign } from "@/components/home/campaign";
import { CategoryList } from "@/components/home/category-list";
import { Countdown } from "@/components/home/countdown";
import { GalleryWall } from "@/components/home/gallery-wall";
import { Hero } from "@/components/home/hero";
import { Lookbook } from "@/components/home/lookbook";
import { Manifesto } from "@/components/home/manifesto";
import { Marquee } from "@/components/home/marquee";
import { Newsletter } from "@/components/home/newsletter";
import { ReviewsWall } from "@/components/home/reviews-wall";
import { ShopTheLook, type Look } from "@/components/home/shop-the-look";
import { ProductCard } from "@/components/product/product-card";
import { buttonClasses } from "@/components/ui/button";
import { EditorialImage } from "@/components/ui/editorial-image";
import { Reveal, RevealText } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { EDITORIAL, HOME_CAMPAIGN, HOME_GALLERY, HOME_LOOKS } from "@/lib/photos/editorial";
import { primaryPhoto } from "@/lib/photos/gallery";
import { getCategories, getFeaturedProducts, getNewProducts, getProductsBySlugs, getSaleProducts } from "@/lib/server/queries/catalog";
import { getHighlightReviews } from "@/lib/server/queries/reviews";
import { PALETTE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  const [categories, featured, fresh, sale, lookProducts, highlights, tr] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getNewProducts(4),
    getSaleProducts(8),
    getProductsBySlugs(HOME_LOOKS.flatMap((l) => l.spots.map((s) => s.slug))),
    getHighlightReviews(14),
    getTranslations("Reviews"),
  ]);

  const looks: Look[] = HOME_LOOKS.map((l, i) => ({
    photo: l.photo,
    alt: t(`lookAlt${i + 1}` as "lookAlt1"),
    spots: l.spots.flatMap((spot) => {
      const p = lookProducts.find((x) => x.slug === spot.slug);
      if (!p) return [];
      const wanted = PALETTE.find((c) => c.key === spot.color)?.hex;
      const color = p.colors.find((c) => c.hex.toLowerCase() === wanted)?.hex ?? p.colors[0]?.hex ?? "#cccccc";
      return [{ slug: p.slug, nameVi: p.nameVi, nameEn: p.nameEn, price: p.price, compareAtPrice: p.compareAtPrice, kind: p.kind, color, image: primaryPhoto(p.images, color), x: spot.x, y: spot.y }];
    }),
  }));
  const campaignText = t.raw("campaign") as { title: string; text: string }[];

  const values = t.raw("values") as { title: string; text: string }[];
  const valueIcons = [Truck, RotateCcw, Leaf];

  return (
    <>
      <Hero />
      <Marquee items={t.raw("marquee") as string[]} />
      <Manifesto eyebrow={t("manifestoEyebrow")} text={t("manifesto")} highlight={t.raw("manifestoHighlight") as string[]} />
      <CategoryList categories={categories} title={t("categoriesTitle")} cta={t("viewAll")} />

      {/* Featured */}
      <section className="container-x py-12">
        <SectionHeader title={t("featuredTitle")} sub={t("featuredSub")} href="/shop?sort=popular" cta={t("viewAll")} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.08}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <ShopTheLook looks={looks} />

      <Campaign
        eyebrow={t("campaignEyebrow")}
        title={t("campaignTitle")}
        cta={t("campaignCta")}
        slides={HOME_CAMPAIGN.map((c, i) => ({ ...c, title: campaignText[i]?.title ?? "", text: campaignText[i]?.text ?? "" }))}
      />

      <Lookbook />

      {/* Flash sale */}
      <section className="py-12">
        <div className="container-x">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1c1a17] text-[#f7f4ee]">
              <div aria-hidden className="absolute -top-1/2 -right-1/4 size-[60vmax] animate-blob rounded-full bg-accent/40 blur-[100px]" />
              <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end lg:p-16">
                <div>
                  <p className="mb-3 text-xs tracking-[0.3em] text-accent uppercase">Flash sale · -30%</p>
                  <h2 className="font-display text-5xl sm:text-6xl">{t("saleTitle")}</h2>
                  <p className="mt-4 max-w-md opacity-70">{t("saleSub")}</p>
                  <div className="mt-8">
                    <Countdown />
                  </div>
                </div>
                <Link href="/shop?sale=1" className={buttonClasses({ size: "lg", variant: "accent", className: "group w-fit" })}>
                  {t("saleCta")}
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <div className="no-scrollbar relative flex snap-x gap-4 overflow-x-auto px-8 pb-10 sm:px-12 lg:px-16" data-lenis-prevent-wheel>
                {sale.map((p) => (
                  <div key={p.id} className="w-[46vw] shrink-0 snap-start sm:w-64 [&_h3]:text-[#f7f4ee] [&_.text-muted]:text-[#f7f4ee]/60">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-x py-20">
        <SectionHeader title={t("newTitle")} href="/shop?new=1" cta={t("viewAll")} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {fresh.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.08}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <ReviewsWall
        reviews={highlights}
        locale={locale}
        title={t("reviewsTitle")}
        sub={t("reviewsSub")}
        verifiedLabel={tr("verified")}
      />

      <GalleryWall
        shots={HOME_GALLERY}
        title={t("galleryTitle")}
        sub={t("gallerySub")}
        cta={t("galleryCta")}
      />

      <Marquee items={t.raw("marquee") as string[]} reverse />

      {/* Values */}
      <section className="container-x grid gap-10 py-24 md:grid-cols-3">
        {values.map((v, i) => {
          const Icon = valueIcons[i];
          return (
            <Reveal key={v.title} delay={i * 0.1} className="group">
              <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-subtle transition-all duration-500 group-hover:-rotate-6 group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon size={24} />
              </div>
              <h3 className="font-display text-2xl">{v.title}</h3>
              <p className="mt-2 text-muted">{v.text}</p>
            </Reveal>
          );
        })}
      </section>

      {/* Newsletter */}
      <section className="container-x">
        <div className="relative isolate overflow-hidden rounded-[2rem] px-6 py-20 text-center sm:py-28">
          <div aria-hidden className="absolute inset-0 -z-10">
            <EditorialImage src={EDITORIAL.newsletter} alt="" sizes="100vw" parallax={0.12} reveal={false} className="h-full w-full" />
            <div className="absolute inset-0 bg-background/75" />
          </div>
          <RevealText text={t("newsletterTitle")} className="font-display text-4xl sm:text-5xl" />
          <Reveal delay={0.2}>
            <p className="mx-auto mt-4 mb-8 max-w-md text-muted">{t("newsletterSub")}</p>
            <Newsletter />
          </Reveal>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ title, sub, href, cta }: { title: string; sub?: string; href: string; cta: string }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <div>
        <RevealText text={title} className="font-display text-4xl sm:text-5xl" />
        {sub ? (
          <Reveal delay={0.15}>
            <p className="mt-2 text-muted">{sub}</p>
          </Reveal>
        ) : null}
      </div>
      <Link href={href} className="group hidden shrink-0 items-center gap-2 text-sm font-medium sm:flex">
        <span className="relative">
          {cta}
          <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
        </span>
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
