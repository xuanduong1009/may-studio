"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Common");
  return (
    <section className="container-x flex min-h-[70vh] flex-col items-center justify-center pt-32 text-center">
      <p className="font-display text-5xl">{t("errorTitle")}</p>
      {error.digest ? <p className="mt-3 font-mono text-xs text-muted">#{error.digest}</p> : null}
      <Button className="mt-8" onClick={reset}>
        {t("retry")}
      </Button>
    </section>
  );
}
