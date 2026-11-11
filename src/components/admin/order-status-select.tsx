"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/app/actions/admin";
import { STATUS_STYLES } from "@/components/orders/status-badge";
import { useRouter } from "@/i18n/navigation";
import { STATUS_FLOW, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OrderStatusSelect({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const t = useTranslations("Status");
  const ta = useTranslations("Admin");
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  // only the current status and the transitions allowed from it
  const options = [status, ...STATUS_FLOW[status]];

  return (
    // preventDefault stops the parent <summary> from toggling when the select is clicked
    <span className="relative inline-flex items-center gap-2" onClick={(e) => e.preventDefault()}>
      <select
        value={value}
        disabled={pending || options.length === 1}
        onChange={(e) => {
          const next = e.target.value as OrderStatus;
          const prev = value;
          setValue(next); // optimistic update
          start(async () => {
            const res = await updateOrderStatus(orderId, next);
            if (res.ok) {
              toast.success(ta("statusUpdated"));
              router.refresh();
            } else {
              setValue(prev);
              toast.error(res.error === "readonly" ? ta("readonly") : res.error === "transition" ? ta("transitionError") : ta("invalid"));
            }
          });
        }}
        className={cn("h-8 cursor-pointer appearance-none rounded-full border-0 px-3 pr-7 text-xs font-medium outline-none disabled:cursor-default", STATUS_STYLES[value])}
        aria-label={ta("table.status")}
      >
        {options.map((s) => (
          <option key={s} value={s} className="bg-background text-foreground">
            {t(s)}
          </option>
        ))}
      </select>
      {options.length > 1 ? <ChevronDown size={12} className="pointer-events-none absolute right-2.5 opacity-60" /> : null}
      {pending ? <Loader2 size={14} className="animate-spin text-muted" /> : null}
    </span>
  );
}
