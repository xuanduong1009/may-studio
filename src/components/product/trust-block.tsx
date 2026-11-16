"use client";

import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMounted } from "@/hooks/use-mounted";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";

/** Delivery estimate, free returns and payment methods, right under the buy buttons. */
export function TrustBlock() {
  const t = useTranslations("Product");
  const locale = useLocale();
  const mounted = useMounted();
  const fmt = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", { weekday: "short", day: "numeric", month: "numeric" });
  const inDays = (d: number) => fmt.format(new Date(Date.now() + d * 86_400_000));
  const rows = [
    {
      icon: Truck,
      title: mounted ? t("deliveryBy", { from: inDays(2), to: inDays(4) }) : t("deliveryDays"),
      hint: t("freeShipOver", { amount: formatPrice(FREE_SHIPPING_THRESHOLD, locale) }),
    },
    { icon: RotateCcw, title: t("returnsTitle"), hint: t("returnsHint") },
    { icon: ShieldCheck, title: t("secureTitle"), hint: "COD · VietQR · VNPay" },
  ];
  return (
    <ul className="mt-8 divide-y divide-border rounded-2xl border border-border">
      {rows.map((r) => (
        <li key={r.hint} className="flex items-start gap-4 px-5 py-4">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-subtle">
            <r.icon size={17} strokeWidth={1.6} />
          </span>
          <div className="text-sm">
            <p className="font-medium">{r.title}</p>
            <p className="mt-0.5 text-muted">{r.hint}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
