"use client";

import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { Address } from "@/lib/db/schema";
import { CITIES } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { AddressInput } from "@/lib/validators";

type Item = Pick<Address, "id" | "label" | "fullName" | "phone" | "address" | "city" | "isDefault">;

const EMPTY: AddressInput = { label: "", fullName: "", phone: "", address: "", city: CITIES[0], isDefault: false };

export function AddressBook({ items }: { items: Item[] }) {
  const t = useTranslations("Account");
  const router = useRouter();
  const [editing, setEditing] = useState<{ id: number | null; values: AddressInput } | null>(null);
  const [busy, start] = useTransition();

  function run(task: () => Promise<{ ok: boolean }>, success: string) {
    start(async () => {
      const res = await task();
      if (res.ok) {
        toast.success(success);
        router.refresh();
      } else toast.error(t("addressError"));
    });
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {items.map((a) => (
            <motion.div
              layout
              key={a.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={cn("relative rounded-3xl border bg-card p-5", a.isDefault ? "border-foreground" : "border-border")}
            >
              {a.isDefault ? (
                <span className="absolute top-4 right-4 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] text-background">{t("default")}</span>
              ) : null}
              <MapPin size={18} className="text-accent" />
              <p className="mt-3 font-medium">
                {a.fullName} {a.label ? <span className="font-normal text-muted">· {a.label}</span> : null}
              </p>
              <p className="text-sm text-muted">{a.phone}</p>
              <p className="text-sm text-muted">
                {a.address}, {a.city}
              </p>
              <div className="mt-4 flex flex-wrap gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing({ id: a.id, values: { ...a } })}>
                  <Pencil size={14} /> {t("edit")}
                </Button>
                {!a.isDefault ? (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => setDefaultAddress(a.id), t("addressSaved"))}>
                    <Star size={14} /> {t("makeDefault")}
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" disabled={busy} className="text-danger hover:bg-danger/10" onClick={() => run(() => deleteAddress(a.id), t("addressDeleted"))}>
                  <Trash2 size={14} /> {t("remove")}
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={() => setEditing({ id: null, values: { ...EMPTY, isDefault: items.length === 0 } })}
          className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          <Plus size={22} /> {t("addAddress")}
        </button>
      </div>

      <AnimatePresence>
        {editing ? <AddressForm key={editing.id ?? "new"} initial={editing} onClose={() => setEditing(null)} /> : null}
      </AnimatePresence>
    </div>
  );
}

function AddressForm({ initial, onClose }: { initial: { id: number | null; values: AddressInput }; onClose: () => void }) {
  const t = useTranslations("Account");
  const tc = useTranslations("Checkout");
  const router = useRouter();
  const [v, setV] = useState(initial.values);
  const [bad, setBad] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const set = <K extends keyof AddressInput>(k: K, value: AddressInput[K]) => setV((p) => ({ ...p, [k]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveAddress(initial.id, v);
      if (res.ok) {
        toast.success(t("addressSaved"));
        router.refresh();
        onClose();
      } else {
        setBad(res.fields ?? []);
        toast.error(t("addressError"));
      }
    });
  }

  const input = (k: string) => cn("h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:border-foreground", bad.includes(k) ? "border-danger" : "border-border");

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-6 grid gap-4 rounded-3xl border border-border bg-card p-5 sm:grid-cols-2 sm:p-7">
        <h2 className="font-display text-2xl sm:col-span-2">{initial.id ? t("editAddress") : t("addAddress")}</h2>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">{tc("name")}</span>
          <input className={input("fullName")} value={v.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">{tc("phone")}</span>
          <input className={input("phone")} value={v.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" inputMode="tel" required />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1.5 block text-muted">{tc("address")}</span>
          <input className={input("address")} value={v.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">{tc("city")}</span>
          <select className={input("city")} value={v.city} onChange={(e) => set("city", e.target.value)}>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">{t("label")}</span>
          <input className={input("label")} value={v.label} onChange={(e) => set("label", e.target.value)} placeholder={t("labelPlaceholder")} maxLength={30} />
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
          <input type="checkbox" checked={v.isDefault} onChange={(e) => set("isDefault", e.target.checked)} className="size-4 accent-[var(--accent)]" />
          {t("setDefault")}
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : null} {t("save")}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
        </div>
      </div>
    </motion.form>
  );
}
