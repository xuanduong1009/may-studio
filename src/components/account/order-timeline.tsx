import { Ban, Check, CircleDollarSign, Clock, MessageSquare, PackageCheck, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { OrderEvent, OrderStatus } from "@/lib/db/schema";
import { cn, formatDate } from "@/lib/utils";

const STEPS: OrderStatus[] = ["pending", "confirmed", "shipping", "delivered"];
const ICONS = { pending: Clock, confirmed: Check, shipping: Truck, delivered: PackageCheck };

/** Progress bar with the date each step was reached, read from the order's event log. */
export function OrderProgress({ status, events, createdAt, locale }: { status: OrderStatus; events: OrderEvent[]; createdAt: Date; locale: string }) {
  const ts = useTranslations("Status");
  if (status === "cancelled") return null;
  const reached = STEPS.indexOf(status);
  const dateOf = (s: OrderStatus) =>
    s === "pending" ? createdAt : events.find((e) => e.type === "status" && e.status === s)?.createdAt;

  return (
    <ol className="relative grid grid-cols-4">
      <div className="absolute top-4 right-[12.5%] left-[12.5%] h-0.5 bg-subtle" aria-hidden>
        <div className="h-full bg-accent transition-all duration-700" style={{ width: `${(Math.max(reached, 0) / (STEPS.length - 1)) * 100}%` }} />
      </div>
      {STEPS.map((s, i) => {
        const Icon = ICONS[s as keyof typeof ICONS];
        const done = i <= reached;
        const date = dateOf(s);
        return (
          <li key={s} className="relative flex flex-col items-center text-center">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full border-2 transition-colors",
                done ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-muted",
                i === reached && "ring-4 ring-accent/20",
              )}
            >
              <Icon size={15} />
            </span>
            <span className={cn("mt-2 text-[11px] sm:text-xs", done ? "font-medium text-foreground" : "text-muted")}>{ts(s)}</span>
            {done && date ? <span className="text-[10px] text-muted">{formatDate(date, locale)}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Full audit trail: status changes, payments and notes. */
export function OrderEventLog({ events, locale, showNotes = false }: { events: OrderEvent[]; locale: string; showNotes?: boolean }) {
  const t = useTranslations("Track");
  const ts = useTranslations("Status");
  const visible = events.filter((e) => e.type !== "email" && (showNotes || e.type !== "note"));

  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {[...visible].reverse().map((e) => {
        const Icon = e.type === "payment" ? CircleDollarSign : e.type === "note" ? MessageSquare : e.status === "cancelled" ? Ban : e.status === "shipping" ? Truck : Check;
        const label =
          e.type === "created"
            ? t("eventCreated")
            : e.type === "payment"
              ? e.status === "refunded"
                ? t("eventRefunded")
                : e.status === "failed"
                  ? t("eventPaymentFailed")
                  : e.status === "partial"
                    ? t("eventPartial")
                    : t("eventPaid")
              : e.type === "note"
                ? t("eventNote")
                : t("eventStatus", { status: ts((e.status ?? "pending") as OrderStatus) });
        return (
          <li key={e.id} className="relative">
            <span className="absolute top-0.5 -left-[35px] grid size-[22px] place-items-center rounded-full border border-border bg-background text-muted">
              <Icon size={12} />
            </span>
            <p className="text-sm font-medium">{label}</p>
            {e.message ? <p className="mt-0.5 text-sm text-muted">{e.message}</p> : null}
            <p className="mt-0.5 text-xs text-muted">
              {formatDate(e.createdAt, locale, true)}
              {showNotes ? ` · ${e.actor}` : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
