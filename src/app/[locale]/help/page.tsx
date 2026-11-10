import { Clock, Mail, MapPin, Package, Phone, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm, FaqSearch } from "@/components/help/help-center";
import { Reveal, RevealText } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEES } from "@/lib/pricing";
import { site, SIZE_GUIDE } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("Help");
  return { title: t("title"), description: t("subtitle") };
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("Help");
  const tp = await getTranslations("Product");
  const groups = t.raw("faq") as { title: string; items: { q: string; a: string }[] }[];

  const policies = [
    {
      id: "shipping",
      icon: Truck,
      title: t("shippingTitle"),
      text: t("shippingText", {
        free: formatPrice(FREE_SHIPPING_THRESHOLD, locale),
        standard: formatPrice(SHIPPING_FEES.standard, locale),
        express: formatPrice(SHIPPING_FEES.express, locale),
      }),
    },
    { id: "returns", icon: RotateCcw, title: t("returnsTitle"), text: t("returnsText") },
    { id: "payment", icon: ShieldCheck, title: t("paymentTitle"), text: t("paymentText") },
    { id: "tracking", icon: Package, title: t("trackingTitle"), text: t("trackingText"), href: "/track" },
  ];

  return (
    <div className="pt-36 pb-12">
      <section className="container-x text-center">
        <p className="mb-4 text-xs font-semibold tracking-[0.3em] text-accent uppercase">{t("eyebrow")}</p>
        <RevealText text={t("title")} className="font-display text-5xl sm:text-7xl" />
        <Reveal delay={0.15}>
          <p className="mx-auto mt-4 max-w-xl text-muted">{t("subtitle")}</p>
        </Reveal>
      </section>

      <section className="container-x mt-12">
        <FaqSearch groups={groups} />
      </section>

      <section className="container-x mt-28 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {policies.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.06}>
            <article id={p.id} className="h-full scroll-mt-28 rounded-3xl border border-border bg-card p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-subtle text-accent">
                <p.icon size={22} />
              </span>
              <h2 className="mt-5 font-display text-2xl">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              {p.href ? (
                <Link href={p.href} className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
                  {t("trackingCta")}
                </Link>
              ) : null}
            </article>
          </Reveal>
        ))}
      </section>

      <section id="size" className="container-x mt-24 scroll-mt-28">
        <h2 className="font-display text-4xl">{tp("sizeGuide")}</h2>
        <p className="mt-2 text-muted">{tp("sizeGuideIntro")}</p>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-6 py-3 font-medium">{tp("size")}</th>
                <th className="px-6 py-3 font-medium">{tp("chest")} (cm)</th>
                <th className="px-6 py-3 font-medium">{tp("waist")} (cm)</th>
                <th className="px-6 py-3 font-medium">{tp("height")} (cm)</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_GUIDE.map((r) => (
                <tr key={r.size} className="border-b border-border/60 last:border-0">
                  <td className="px-6 py-3 font-semibold">{r.size}</td>
                  <td className="px-6 py-3 tabular-nums">{r.chest}</td>
                  <td className="px-6 py-3 tabular-nums">{r.waist}</td>
                  <td className="px-6 py-3 tabular-nums">{r.height}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="contact" className="container-x mt-24 grid scroll-mt-28 gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-display text-4xl sm:text-5xl">{t("contactTitle")}</h2>
          <p className="mt-3 text-muted">{t("contactText")}</p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-accent" /> {site.email}
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-accent" /> {site.phone}
            </li>
            <li className="flex items-center gap-3">
              <MapPin size={18} className="text-accent" /> {site.address}
            </li>
            <li className="flex items-center gap-3">
              <Clock size={18} className="text-accent" /> {t("hours")}
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
