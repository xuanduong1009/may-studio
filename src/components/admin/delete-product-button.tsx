"use client";

import { Loader2, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteProduct } from "@/app/actions/admin";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Two-step delete: first click arms the button, second click deletes. */
export function DeleteProductButton({ id }: { id: number }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  function onClick() {
    if (!armed) {
      setArmed(true);
      return;
    }
    start(async () => {
      const res = await deleteProduct(id);
      if (res.ok) {
        toast.success(t("deleted"));
        router.refresh();
      } else {
        toast.error(res.error === "readonly" ? t("readonly") : t("invalid"));
        setArmed(false);
      }
    });
  }

  return (
    <motion.button
      layout
      onClick={onClick}
      disabled={pending}
      aria-label={armed ? t("confirmDelete") : t("delete")}
      title={armed ? t("confirmDelete") : t("delete")}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center gap-1.5 overflow-hidden rounded-full px-2.5 text-xs font-medium whitespace-nowrap transition-colors",
        armed ? "bg-danger text-white" : "text-muted hover:bg-danger/10 hover:text-danger",
      )}
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      <AnimatePresence>
        {armed ? (
          <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}>
            {t("confirmDelete")}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}
