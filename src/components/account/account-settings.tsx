"use client";

import { KeyRound, Loader2, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

const field = "h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-foreground";

export function AccountSettings({ name: initialName, isDemo }: { name: string; isDemo: boolean }) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setSavingName(true);
    const res = await authClient.updateUser({ name: name.trim() });
    setSavingName(false);
    if (res.error) return toast.error(t("saveError"));
    toast.success(t("profileSaved"));
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (isDemo) return toast.error(t("demoLocked"));
    setSavingPw(true);
    const res = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
    setSavingPw(false);
    if (res.error) return toast.error(t("passwordError"));
    setCurrent("");
    setNext("");
    toast.success(t("passwordChanged"));
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={saveName} className="space-y-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <UserRound size={20} className="text-accent" /> {t("profile")}
        </h2>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">{t("displayName")}</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required />
        </label>
        <Button type="submit" disabled={savingName || name.trim() === initialName}>
          {savingName ? <Loader2 size={16} className="animate-spin" /> : null} {t("save")}
        </Button>
      </form>

      <form onSubmit={changePassword} className="space-y-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <KeyRound size={20} className="text-accent" /> {t("changePassword")}
        </h2>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">{t("currentPassword")}</span>
          <input className={field} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">{t("newPassword")}</span>
          <input className={field} type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        <p className="text-xs text-muted">{t("signOutOthers")}</p>
        <Button type="submit" disabled={savingPw}>
          {savingPw ? <Loader2 size={16} className="animate-spin" /> : null} {t("updatePassword")}
        </Button>
      </form>
    </div>
  );
}
