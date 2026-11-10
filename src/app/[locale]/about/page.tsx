import { ArrowRight, Clock, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CountUp } from "@/components/admin/charts";
import { Manifesto } from "@/components/home/manifesto";
import Image from "next/image";
import { EditorialImage } from "@/components/ui/editorial-image";
import { EDITORIAL } from "@/lib/editorial";
import { buttonClasses } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { Reveal, RevealText } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { asLocale } from "@/i18n/routing";
import { site } from "@/lib/site";

export async function generateMetadata() {
  const t = await getTranslations("About");
  return { title: t("title"), description: t("lead") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("About");
  const stats = t.raw("stats") as { value: number; suffix: string; label: string }[];
  const timeline = t.raw("timeline") as { year: string; title: string; text: string }[];
  const process = t.raw("process") as { title: string; text: string }[];
  const stores = t.raw("stores") as { city: string; address: string; hours: string }[];

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate flex min-h-[92svh] items-end overflow-hidden pt-36 pb-16 text-white">
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image src={EDITORIAL.aboutAtelier} alt="" fill priority sizes="100vw" className="scale-105 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/35" />
        </div>
        <div className="container-x">
          <p className="mb-6 text-xs font-semibold tracking-[0.3em] text-[#f0b49c] uppercase">{t("eyebrow")}</p>
          <RevealText text={t("title")} className="max-w-5xl font-display text-[clamp(3rem,9vw,8rem)] leading-[0.95]" />
          <Reveal delay={0.3}>
            <p className="mt-8 max-w-xl text-lg text-white/80">{t("lead")}</p>
          </Reveal>
        </div>
      </section>

      <Manifesto eyebrow={t("manifestoEyebrow")} text={t("manifesto")} highlight={t.raw("manifestoHighlight") as string[]} />

      {/* Numbers */}
      <section className="container-x grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] border border-border bg-border lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background p-8">
            <p className="font-display text-5xl sm:text-6xl">
              <CountUp value={s.value} format="number" locale={locale} />
              <span className="text-accent">{s.suffix}</span>
            </p>
            <p className="mt-2 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Process */}
      <section className="container-x py-28">
        <RevealText text={t("processTitle")} className="mb-12 font-display text-4xl sm:text-5xl" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <article className="group">
                <div className="relative">
                  <EditorialImage src={EDITORIAL.process[i % 4]} alt={p.title} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 92vw" parallax={0.06} className="aspect-[4/5] rounded-3xl" />
                  <span className="absolute top-4 left-5 font-display text-6xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-2xl">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-foreground py-28 text-background">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="mb-4 text-xs tracking-[0.3em] text-accent uppercase">{t("timelineEyebrow")}</p>
            <h2 className="font-display text-5xl sm:text-6xl">{t("timelineTitle")}</h2>
          </div>
          <ol className="relative border-l border-background/20">
            {timeline.map((e, i) => (
              <li key={e.year} className="relative pb-14 pl-10 last:pb-0">
                <span className="absolute top-3 -left-[7px] size-3.5 rounded-full border-2 border-foreground bg-accent" />
                <Reveal delay={i * 0.05}>
                  <p className="font-display text-4xl text-accent">{e.year}</p>
                  <h3 className="mt-2 text-xl font-medium">{e.title}</h3>
                  <p className="mt-2 max-w-lg text-background/70">{e.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stores */}
      <section id="stores" className="container-x scroll-mt-28 py-28">
        <RevealText text={t("storesTitle")} className="mb-10 font-display text-4xl sm:text-5xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {stores.map((s, i) => (
            <Reveal key={s.city} delay={i * 0.08}>
              <div className="flex h-full flex-col justify-between gap-8 overflow-hidden rounded-3xl border border-border bg-card p-3 pb-8">
                <EditorialImage src={EDITORIAL.stores[i % 2]} alt={s.city} sizes="(min-width: 768px) 45vw, 92vw" parallax={0.05} className="aspect-[16/10] rounded-2xl" />
                <p className="px-5 font-display text-4xl">{s.city}</p>
                <div className="space-y-2 px-5 text-sm text-muted">
                  <p className="flex items-center gap-2">
                    <MapPin size={16} className="text-accent" /> {s.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={16} className="text-accent" /> {s.hours}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Careers + CTA */}
      <section id="careers" className="container-x scroll-mt-28 pb-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-subtle px-6 py-20 text-center sm:px-12">
          <RevealText text={t("ctaTitle")} className="mx-auto max-w-3xl font-display text-4xl sm:text-6xl" />
          <Reveal delay={0.15}>
            <p className="mx-auto mt-4 max-w-lg text-muted">{t("careers", { email: site.email })}</p>
            <div className="mt-10 flex justify-center">
              <Magnetic>
                <Link href="/shop" className={buttonClasses({ size: "lg", className: "group" })}>
                  {t("cta")} <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
