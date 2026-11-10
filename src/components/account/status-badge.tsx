import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  confirmed: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  shipping: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const t = useTranslations("Status");
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLES[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {t(status)}
    </span>
  );
}
