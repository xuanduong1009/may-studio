"use client";

import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteReview, setReviewHidden, setUserRole, type ActionResult } from "@/app/actions/admin";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function useAdminAction() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (task: () => Promise<ActionResult>, ok: string) =>
    start(async () => {
      const res = await task();
      if (res.ok) {
        toast.success(ok);
        router.refresh();
      } else toast.error(res.error === "readonly" ? t("readonly") : res.error === "self" ? t("roleSelf") : t("invalid"));
    });
  return { pending, run, t };
}

export function RoleSelect({ userId, role, disabled }: { userId: string; role: string; disabled?: boolean }) {
  const { pending, run, t } = useAdminAction();
  const [value, setValue] = useState(role);
  return (
    <span className="inline-flex items-center gap-2">
      <select
        value={value}
        disabled={pending || disabled}
        aria-label={t("role")}
        onChange={(e) => {
          const next = e.target.value;
          const prev = value;
          setValue(next);
          run(async () => {
            const res = await setUserRole(userId, next);
            if (!res.ok) setValue(prev);
            return res;
          }, t("roleUpdated"));
        }}
        className={cn(
          "h-8 rounded-full border-0 px-3 text-xs font-medium outline-none disabled:opacity-60",
          value === "admin" ? "bg-accent/15 text-accent" : value === "viewer" ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" : "bg-subtle",
        )}
      >
        <option value="user">{t("roles.user")}</option>
        <option value="viewer">{t("roles.viewer")}</option>
        <option value="admin">{t("roles.admin")}</option>
      </select>
      {pending ? <Loader2 size={13} className="animate-spin text-muted" /> : null}
    </span>
  );
}

export function ReviewActions({ id, hidden }: { id: number; hidden: boolean }) {
  const { pending, run, t } = useAdminAction();
  const [confirm, setConfirm] = useState(false);
  return (
    <span className="flex items-center gap-1">
      <button
        disabled={pending}
        onClick={() => run(() => setReviewHidden(id, !hidden), hidden ? t("reviewShown") : t("reviewHidden"))}
        className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs hover:bg-subtle"
      >
        {hidden ? <Eye size={14} /> : <EyeOff size={14} />} {hidden ? t("show") : t("hide")}
      </button>
      <button
        disabled={pending}
        onClick={() => (confirm ? run(() => deleteReview(id), t("reviewDeleted")) : setConfirm(true))}
        onBlur={() => setConfirm(false)}
        className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-danger hover:bg-danger/10", confirm && "bg-danger text-white hover:bg-danger")}
      >
        <Trash2 size={14} /> {confirm ? t("confirmDelete") : t("delete")}
      </button>
    </span>
  );
}
