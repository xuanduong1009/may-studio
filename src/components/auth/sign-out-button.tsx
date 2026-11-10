"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const t = useTranslations("Nav");
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
      className="flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm transition-colors hover:border-foreground"
    >
      <LogOut size={16} /> {t("logout")}
    </button>
  );
}
