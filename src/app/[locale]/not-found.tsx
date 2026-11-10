import { useTranslations } from "next-intl";
import { GarmentArt } from "@/components/product/garment-art";
import { buttonClasses } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("Common");
  return (
    <section className="container-x flex min-h-[80vh] flex-col items-center justify-center pt-32 text-center">
      <div className="relative mb-8 w-44 animate-float overflow-hidden rounded-3xl [--r:-4deg]">
        <GarmentArt kind="tee" color="#d8a7a1" view="back" />
      </div>
      <p className="font-display text-7xl">404</p>
      <h1 className="mt-4 text-2xl font-medium">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-md text-muted">{t("notFoundText")}</p>
      <Link href="/" className={buttonClasses({ className: "mt-8" })}>
        {t("backHome")}
      </Link>
    </section>
  );
}
