"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { GarmentArt } from "@/components/product/garment-art";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function AuthForm({ mode, redirectTo }: { mode: "login" | "register"; redirectTo?: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const target = redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/account";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res =
      mode === "login"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name });
    setLoading(false);
    if (res.error) {
      setError(mode === "login" ? t("error") : t("registerError"));
      return;
    }
    router.push(target);
    router.refresh();
  }

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-subtle lg:block">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <GarmentArt kind={mode === "login" ? "jacket" : "dress"} color={mode === "login" ? "#a3b19b" : "#d8a7a1"} className="h-full w-full" />
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-12 text-white">
          <p className="font-display text-5xl italic">Mây.</p>
          <p className="mt-2 max-w-sm opacity-80">{mode === "login" ? t("loginSub") : t("registerSub")}</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 pt-32 pb-16 sm:px-6">
        <motion.form
          onSubmit={onSubmit}
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-4xl sm:text-5xl">{mode === "login" ? t("loginTitle") : t("registerTitle")}</h1>
          <p className="mt-3 text-muted lg:hidden">{mode === "login" ? t("loginSub") : t("registerSub")}</p>

          <div className="mt-10 space-y-5">
            {mode === "register" ? (
              <FloatingInput label={t("name")} value={name} onChange={setName} autoComplete="name" required minLength={2} />
            ) : null}
            <FloatingInput label={t("email")} type="email" value={email} onChange={setEmail} autoComplete="email" required />
            <div className="relative">
              <FloatingInput
                label={t("password")}
                type={show ? "text" : "password"}
                value={password}
                onChange={setPassword}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-foreground" aria-label="Toggle password">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === "register" ? <p className="-mt-3 text-xs text-muted">{t("passwordHint")}</p> : null}
            {mode === "login" ? (
              <div className="-mt-2 text-right">
                <Link href="/forgot-password" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
                  {t("forgot")}
                </Link>
              </div>
            ) : null}
          </div>

          <AnimatePresence>
            {error ? (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto", x: [0, -6, 6, 0] }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {error}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <Button size="lg" className="mt-8 w-full" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? t("loading") : mode === "login" ? t("login") : t("register")}
          </Button>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
            <Link
              href={`${mode === "login" ? "/register" : "/login"}${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {mode === "login" ? t("register") : t("login")}
            </Link>
          </p>

          {/* demo logins are hidden unless NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true at build time */}
          {mode === "login" && process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true" ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border p-4 text-xs text-muted">
              <p className="mb-2 font-semibold text-foreground">Demo</p>
              <button type="button" className="block hover:text-foreground" onClick={() => { setEmail("demo@may.studio"); setPassword("demo12345"); }}>
                👤 demo@may.studio / demo12345
              </button>
              <button type="button" className="mt-1 block hover:text-foreground" onClick={() => { setEmail("viewer@may.studio"); setPassword("viewer12345"); }}>
                🛠 viewer@may.studio / viewer12345 (admin, read-only)
              </button>
            </div>
          ) : null}
        </motion.form>
      </div>
    </div>
  );
}

export function FloatingInput({
  label,
  value,
  onChange,
  className,
  ...props
}: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className={cn("relative block", className)}>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="peer h-14 w-full rounded-xl border border-border bg-card px-4 pt-4 outline-none transition-colors focus:border-foreground"
      />
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted transition-all duration-200 peer-focus:top-3.5 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:text-[11px]">
        {label}
      </span>
    </label>
  );
}
