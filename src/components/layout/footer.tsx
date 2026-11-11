import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";

export async function Footer() {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");

  const columns = [
    {
      title: t("shop"),
      links: [
        { href: "/shop", label: nav("shop") },
        { href: "/shop?new=1", label: nav("newArrivals") },
        { href: "/shop?sale=1", label: nav("sale") },
        { href: "/wishlist", label: nav("wishlist") },
      ],
    },
    {
      title: t("help"),
      links: [
        { href: "/track", label: nav("track") },
        { href: "/help#shipping", label: t("shippingPolicy") },
        { href: "/help#returns", label: t("returns") },
        { href: "/help#size", label: t("sizeGuide") },
        { href: "/help#contact", label: t("contact") },
        { href: "/help", label: nav("help") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/about", label: t("about") },
        { href: "/about#stores", label: t("stores") },
        { href: "/about#careers", label: t("careers") },
      ],
    },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden bg-foreground text-background">
      <div className="container-x grid gap-12 pt-20 pb-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs space-y-4">
          <p className="font-display text-3xl tracking-[0.18em]">MÂY</p>
          <p className="text-sm leading-relaxed text-background/60">{t("tagline")}</p>
          <div className="space-y-1 text-sm text-background/60">
            <p>{site.address}</p>
            <p>{site.email}</p>
            <p>{site.phone}</p>
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="mb-4 text-xs tracking-[0.2em] text-background/50 uppercase">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-background/80 transition-colors hover:text-background">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* oversized wordmark */}
      <div aria-hidden className="pointer-events-none select-none">
        <p className="container-x font-display text-[26vw] leading-[0.8] font-semibold tracking-tight text-background/[0.06] lg:text-[22rem]">
          Mây
        </p>
      </div>

      <div className="border-t border-background/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-background/50 sm:flex-row sm:justify-between">
          <p>{t("rights", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
