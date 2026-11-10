"use client";

import { Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

/** Two-step cancel (click, then confirm) for orders that are still pending. */
export function CancelOrderButton({ code, contact }: { code: string; contact?: string }) {
  const t = useTranslations("Track");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-danger hover:bg-danger/10">
        <XCircle size={15} /> {t("cancel")}
      </Button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      {t("cancelConfirm")}
      <Button
        size="sm"
        className="bg-danger text-white hover:bg-danger/90"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await cancelOrder(code, contact);
            if (res.ok) {
              toast.success(t("cancelled"));
              router.refresh();
            } else {
              toast.error(t("cancelFailed"));
            }
            setConfirming(false);
          })
        }
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : null} {t("cancelYes")}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        {t("cancelNo")}
      </Button>
    </span>
  );
}
