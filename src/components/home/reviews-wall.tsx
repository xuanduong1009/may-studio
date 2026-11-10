import { BadgeCheck, Quote } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { Stars } from "@/components/ui/stars";
import { Link } from "@/i18n/navigation";

type ReviewCard = {
  id: number;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  slug: string;
  nameVi: string;
  nameEn: string;
  kind: string;
  color: string;
  image: string | null;
};

function Card({ r, locale, verifiedLabel }: { r: ReviewCard; locale: string; verifiedLabel: string }) {
  return (
    <figure className="w-[300px] shrink-0 rounded-3xl border border-border bg-card p-5 sm:w-[340px]">
      <div className="flex items-center justify-between">
        <Stars rating={r.rating} />
        <Quote size={18} className="text-accent/50" />
      </div>
      <blockquote className="mt-3 line-clamp-4 text-[15px] leading-relaxed">
        {r.title ? <b className="font-medium">{r.title}. </b> : null}
        {r.body}
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
        <Link href={`/product/${r.slug}`} className="h-12 w-10 shrink-0 overflow-hidden rounded-lg">
          <ProductImage kind={r.kind} color={r.color} imageUrl={r.image} alt="" sizes="40px" />
        </Link>
        <div className="min-w-0 text-sm">
          <p className="flex items-center gap-1.5 font-medium">
            {r.authorName}
            {r.verified ? <BadgeCheck size={14} className="text-success" aria-label={verifiedLabel} /> : null}
          </p>
          <Link href={`/product/${r.slug}`} className="block truncate text-xs text-muted hover:text-foreground">
            {locale === "vi" ? r.nameVi : r.nameEn}
          </Link>
        </div>
      </figcaption>
    </figure>
  );
}

/** Two rows of real customer reviews drifting in opposite directions (pause on hover). */
export function ReviewsWall({
  reviews,
  locale,
  title,
  sub,
  verifiedLabel,
}: {
  reviews: ReviewCard[];
  locale: string;
  title: string;
  sub: string;
  verifiedLabel: string;
}) {
  if (reviews.length < 4) return null;
  const half = Math.ceil(reviews.length / 2);
  const rows = [reviews.slice(0, half), reviews.slice(half)];

  return (
    <section className="overflow-hidden py-24">
      <div className="container-x mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 className="max-w-xl font-display text-4xl sm:text-5xl">{title}</h2>
        <p className="max-w-sm text-muted">{sub}</p>
      </div>
      <div className="space-y-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        {rows.map((row, i) => (
          <div key={i} className="group flex w-max">
            <div
              className={`flex gap-4 pr-4 group-hover:[animation-play-state:paused] ${i ? "animate-[marquee_70s_linear_infinite_reverse]" : "animate-[marquee_60s_linear_infinite]"}`}
            >
              {[...row, ...row].map((r, k) => (
                <Card key={`${r.id}-${k}`} r={r} locale={locale} verifiedLabel={verifiedLabel} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
