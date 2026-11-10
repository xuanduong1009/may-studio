import { cn, formatPrice } from "@/lib/utils";

export function Price({
  price,
  compareAtPrice,
  locale,
  className,
  large,
}: {
  price: number;
  compareAtPrice?: number | null;
  locale: string;
  className?: string;
  large?: boolean;
}) {
  const onSale = !!compareAtPrice && compareAtPrice > price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-semibold tabular-nums", large ? "text-2xl" : "text-sm", onSale && "text-accent")}>
        {formatPrice(price, locale)}
      </span>
      {onSale ? (
        <span className={cn("text-muted line-through tabular-nums", large ? "text-base" : "text-xs")}>
          {formatPrice(compareAtPrice!, locale)}
        </span>
      ) : null}
    </div>
  );
}
