"use client";

import { ArrowLeft, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { FloatingInput } from "./auth-form";

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-4 pt-32 pb-16">
      <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-3 text-muted">{sub}</p>
        {children}
      </motion.div>
    </div>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // the response is the same whether or not the email exists (no account enumeration)
    await authClient.requestPasswordReset({ email, redirectTo: locale === "en" ? "/en/reset-password" : "/reset-password" });
    setLoading(false);
    setSent(true);
  }

  return (
    <Shell title={t("forgotTitle")} sub={t("forgotSub")}>
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-10 rounded-3xl bg-subtle p-6 text-center">
            <MailCheck size={36} className="mx-auto text-success" />
            <p className="mt-3 font-medium">{t("forgotSent")}</p>
            <p className="mt-1 text-sm text-muted">{t("forgotSentHint", { email })}</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }} className="mt-10 space-y-5">
            <FloatingInput label={t("email")} type="email" value={email} onChange={setEmail} autoComplete="email" required />
            <Button size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : null} {t("sendLink")}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
      <Link href="/login" className="mt-8 flex items-center justify-center gap-2 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> {t("backToLogin")}
      </Link>
    </Shell>
  );
}

export function ResetPasswordForm({ token, invalid }: { token?: string; invalid?: boolean }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token || invalid) {
    return (
      <Shell title={t("resetTitle")} sub={t("resetInvalid")}>
        <Link href="/forgot-password" className={buttonClasses({ className: "mt-8 w-full" })}>
          {t("sendLink")}
        </Link>
      </Shell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError(t("passwordMismatch"));
    setLoading(true);
    setError(null);
    const res = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (res.error) return setError(t("resetInvalid"));
    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  return (
    <Shell title={t("resetTitle")} sub={t("resetSub")}>
      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-10 rounded-3xl bg-subtle p-6 text-center">
          <ShieldCheck size={36} className="mx-auto text-success" />
          <p className="mt-3 font-medium">{t("resetDone")}</p>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-5">
          <FloatingInput label={t("newPassword")} type="password" value={password} onChange={setPassword} autoComplete="new-password" required minLength={8} />
          <FloatingInput label={t("confirmPassword")} type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" required minLength={8} />
          {error ? <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
          <Button size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : null} {t("resetSubmit")}
          </Button>
        </form>
      )}
    </Shell>
  );
}
