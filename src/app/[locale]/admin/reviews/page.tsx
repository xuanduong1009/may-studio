import { BadgeCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReviewActions } from "@/components/admin/moderation";
import { GarmentArt } from "@/components/product/garment-art";
import { Stars } from "@/components/ui/stars";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { getAdminReviews } from "@/lib/server/queries/admin";
import { cn, formatDate } from "@/lib/utils";

export default async function AdminReviews({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const { filter } = await searchParams;
  const [t, rows] = await Promise.all([getTranslations("Admin"), getAdminReviews(filter)]);

  const tabs = [
    { key: undefined, label: t("allReviews") },
    { key: "low", label: t("lowRated") },
    { key: "hidden", label: t("hiddenReviews") },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">{t("reviews")}</h1>
      <div className="flex gap-1.5">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.key ? `/admin/reviews?filter=${tab.key}` : "/admin/reviews"}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors",
              filter === tab.key ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? <p className="rounded-3xl bg-subtle p-10 text-center text-muted">{t("noData")}</p> : null}
      <ul className="space-y-3">
        {rows.map(({ review: r, productSlug, productNameVi, productNameEn, kind }) => (
          <li key={r.id} className={cn("flex gap-4 rounded-3xl border border-border bg-card p-5", r.hidden && "opacity-60")}>
            <Link href={`/product/${productSlug}`} className="h-16 w-14 shrink-0 overflow-hidden rounded-xl">
              <GarmentArt kind={kind} color="#d9cbb5" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Link href={`/product/${productSlug}`} className="font-medium hover:underline">
                  {locale === "vi" ? productNameVi : productNameEn}
                </Link>
                <Stars rating={r.rating} />
                {r.hidden ? <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px]">{t("hiddenBadge")}</span> : null}
              </div>
              <p className="mt-1 text-xs text-muted">
                {r.authorName}
                {r.verified ? (
                  <span className="ml-2 inline-flex items-center gap-1 text-success">
                    <BadgeCheck size={12} /> {t("verifiedBuyer")}
                  </span>
                ) : null}{" "}
                · {formatDate(r.createdAt, locale)}
              </p>
              {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
              <p className="mt-1 text-sm text-muted">{r.body}</p>
            </div>
            <ReviewActions id={r.id} hidden={r.hidden} />
          </li>
        ))}
      </ul>
    </div>
  );
}
