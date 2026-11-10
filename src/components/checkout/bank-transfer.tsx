"use client";

import { Check, Copy, FlaskConical, Loader2, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { retryVnpayPayment, simulateBankPayment } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";

/** Polls the order until its payment is confirmed (by the bank webhook or an admin). */
function usePaymentStatus(code: string, initiallyPaid: boolean) {
  const [paid, setPaid] = useState(initiallyPaid);
  useEffect(() => {
    if (paid) return;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${code}/payment`, { cache: "no-store" });
        const data = await res.json();
        if (!stopped && data.paymentStatus === "paid") setPaid(true);
      } catch {
        /* offline: try again next tick */
      }
    };
    const id = setInterval(tick, 4000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [code, paid]);
  return [paid, setPaid] as const;
}

export function BankTransfer({
  code,
  amount,
  qrSvg,
  bank,
  note,
  initiallyPaid,
}: {
  code: string;
  amount: number;
  qrSvg: string;
  bank: { bankName: string; accountNumber: string; accountName: string } | null;
  note: string;
  initiallyPaid: boolean;
}) {
  const t = useTranslations("Payment");
  const locale = useLocale();
  const router = useRouter();
  const [paid, setPaid] = usePaymentStatus(code, initiallyPaid);
  const [simulating, start] = useTransition();

  useEffect(() => {
    if (paid && !initiallyPaid) {
      toast.success(t("received"));
      router.refresh();
    }
  }, [paid, initiallyPaid, router, t]);

  function simulate() {
    start(async () => {
      const res = await simulateBankPayment(code);
      if (res.ok) setPaid(true);
    });
  }

  return (
    <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-3xl border border-border bg-card text-left">
      <AnimatePresence mode="wait" initial={false}>
        {paid ? (
          <motion.div key="paid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <motion.span
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="grid size-16 place-items-center rounded-full bg-success text-background"
            >
              <Check size={32} strokeWidth={3} />
            </motion.span>
            <p className="font-display text-3xl">{t("received")}</p>
            <p className="text-sm text-muted">{t("receivedText", { amount: formatPrice(amount, locale) })}</p>
          </motion.div>
        ) : (
          <motion.div key="pending" exit={{ opacity: 0 }} className="grid gap-6 p-6 sm:grid-cols-[200px_1fr]">
            <div className="relative mx-auto w-full max-w-[200px]">
              <div className="overflow-hidden rounded-2xl border border-border bg-white p-2" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              {!bank ? (
                <span className="absolute top-2 -right-2 rotate-12 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">Demo</span>
              ) : null}
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-medium">{t("scan")}</p>
              {bank ? (
                <>
                  <Info label={t("bank")} value={bank.bankName} />
                  <Info label={t("account")} value={bank.accountNumber} copy />
                  <Info label={t("accountName")} value={bank.accountName} />
                </>
              ) : (
                <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">{t("demoNote")}</p>
              )}
              <Info label={t("amount")} value={formatPrice(amount, locale)} copy={String(amount)} />
              <Info label={t("note")} value={note} copy />
              <p className="flex items-center gap-2 pt-1 text-xs text-muted">
                <Loader2 size={14} className="animate-spin" /> {t("waiting")}
              </p>
              {!bank ? (
                <Button size="sm" variant="outline" onClick={simulate} disabled={simulating}>
                  {simulating ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />} {t("simulate")}
                </Button>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Info({ label, value, copy }: { label: string; value: string; copy?: boolean | string }) {
  const t = useTranslations("Payment");
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-2 font-medium">
        {value}
        {copy ? (
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(typeof copy === "string" ? copy : value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            aria-label={t("copy")}
            className="grid size-7 place-items-center rounded-full hover:bg-subtle"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted" />}
          </button>
        ) : null}
      </span>
    </div>
  );
}

export function VnpayRetry({ code }: { code: string }) {
  const t = useTranslations("Payment");
  const locale = useLocale();
  const [pending, start] = useTransition();
  return (
    <Button
      onClick={() =>
        start(async () => {
          const url = await retryVnpayPayment(code, locale);
          if (url) window.location.href = url;
          else toast.error(t("retryFailed"));
        })
      }
      disabled={pending}
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} {t("retry")}
    </Button>
  );
}
