"use client";

import { Check, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setVariantStock } from "@/app/actions/admin";
import { ProductImage } from "@/components/product/product-image";
import { Link, useRouter } from "@/i18n/navigation";
import type { ProductColor, ProductPhoto } from "@/lib/db/schema";
import { primaryPhoto } from "@/lib/photos/gallery";
import { cn } from "@/lib/utils";

type Row = { id: number; productId: number; nameVi: string; nameEn: string; kind: string; colors: ProductColor[]; images: ProductPhoto[]; colorHex: string; size: string; stock: number };

/** Variants running out, with an inline restock field. */
export function LowStock({ rows }: { rows: Row[] }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  if (rows.length === 0) return <p className="text-sm text-muted">{t("allStocked")}</p>;
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => {
        const color = r.colors.find((c) => c.hex.toLowerCase() === r.colorHex.toLowerCase());
        return (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <div className="h-11 w-9 shrink-0 overflow-hidden rounded-md">
              <ProductImage kind={r.kind} color={r.colorHex} imageUrl={primaryPhoto(r.images, r.colorHex)} alt="" sizes="36px" />
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <Link href={`/admin/products/${r.productId}`} className="block truncate hover:underline">
                {locale === "vi" ? r.nameVi : r.nameEn}
              </Link>
              <p className="text-xs text-muted">
                {(locale === "vi" ? color?.nameVi : color?.nameEn) ?? r.colorHex} · {r.size}
              </p>
            </div>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", r.stock === 0 ? "bg-danger/15 text-danger" : "bg-amber-500/15 text-amber-700 dark:text-amber-300")}>
              {r.stock}
            </span>
            <Restock id={r.id} />
          </li>
        );
      })}
    </ul>
  );
}

function Restock({ id }: { id: number }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(value);
        if (!Number.isInteger(n) || n < 0) return;
        start(async () => {
          const res = await setVariantStock(id, n);
          if (res.ok) {
            toast.success(t("stockUpdated"));
            setValue("");
            router.refresh();
          } else toast.error(res.error === "readonly" ? t("readonly") : t("invalid"));
        });
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        placeholder={t("newStock")}
        aria-label={t("newStock")}
        className="h-8 w-16 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-foreground"
      />
      <button disabled={pending || !value} className="grid size-8 place-items-center rounded-lg bg-foreground text-background disabled:opacity-30" aria-label={t("save")}>
        {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
      </button>
    </form>
  );
}
