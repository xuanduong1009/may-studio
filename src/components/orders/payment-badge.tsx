import { useTranslations } from "next-intl";
import type { PaymentStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STYLES: Record<PaymentStatus, string> = {
  paid: "bg-success/15 text-success",
  unpaid: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  refunded: "bg-subtle text-muted",
};

/** Paid / awaiting payment / refunded pill, shown next to the order status badge. */
export function PaymentBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const t = useTranslations("Track");
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STYLES[status], className)}>{t(`payment.${status}`)}</span>;
}
