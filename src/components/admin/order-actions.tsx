"use client";

import { BadgeDollarSign, Loader2, Printer, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addOrderNote, confirmPayment } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function ConfirmPaymentButton({ orderId }: { orderId: number }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="accent"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await confirmPayment(orderId);
          if (res.ok) {
            toast.success(t("paymentConfirmed"));
            router.refresh();
          } else toast.error(res.error === "readonly" ? t("readonly") : t("invalid"));
        })
      }
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <BadgeDollarSign size={14} />} {t("markPaid")}
    </Button>
  );
}

export function PrintButton() {
  const t = useTranslations("Admin");
  return (
    <Button size="sm" variant="outline" onClick={() => window.print()}>
      <Printer size={14} /> {t("printInvoice")}
    </Button>
  );
}

export function OrderNoteForm({ orderId }: { orderId: number }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!note.trim()) return;
        start(async () => {
          const res = await addOrderNote(orderId, note);
          if (res.ok) {
            setNote("");
            router.refresh();
          } else toast.error(res.error === "readonly" ? t("readonly") : t("invalid"));
        });
      }}
    >
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder={t("notePlaceholder")}
        className="h-10 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-foreground"
      />
      <button disabled={pending || !note.trim()} className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background disabled:opacity-30" aria-label={t("addNote")}>
        {pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
      </button>
    </form>
  );
}
