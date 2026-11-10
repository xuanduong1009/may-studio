"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Check, CreditCard, Loader2, Lock, MapPin, QrCode, Tag, Truck, X, Zap } from "lucide-react";
import { AnimatePresence, animate, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";
import { placeOrder, previewCoupon } from "@/app/actions/orders";
import { CartLine } from "@/components/cart/cart-drawer";
import { buttonClasses } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { Link, useRouter } from "@/i18n/navigation";
import { computeTotals, couponDiscount, expressAvailable, SHIPPING_FEES, type CouponRule } from "@/lib/pricing";
import { CITIES } from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators";
import { cartSubtotal, useCart } from "@/store/cart";

type SavedAddress = { id: number; label: string; fullName: string; phone: string; address: string; city: string; isDefault: boolean };

export function CheckoutForm({
  defaults,
  signedIn,
  addresses,
  payments,
}: {
  defaults: { name?: string; email?: string };
  signedIn: boolean;
  addresses: SavedAddress[];
  payments: { vnpay: boolean };
}) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [pending, startTransition] = useTransition();
  const [checking, startChecking] = useTransition();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponRule | null>(null);
  const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<number | null>(preferred?.id ?? null);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      name: preferred?.fullName ?? defaults.name ?? "",
      email: defaults.email ?? "",
      phone: preferred?.phone ?? "",
      address: preferred?.address ?? "",
      city: preferred?.city ?? CITIES[0],
      note: "",
      shippingMethod: "standard",
      paymentMethod: "cod",
      couponCode: null,
      saveAddress: signedIn && addresses.length === 0,
    },
  });
  const { register, handleSubmit, watch, setValue, formState } = form;
  const shippingMethod = watch("shippingMethod");
  const paymentMethod = watch("paymentMethod");
  const city = watch("city");
  const canExpress = expressAvailable(city);

  // express delivery only exists in some cities
  useEffect(() => {
    if (!canExpress && shippingMethod === "express") setValue("shippingMethod", "standard");
  }, [canExpress, shippingMethod, setValue]);

  const subtotal = cartSubtotal(items);
  const totals = computeTotals({ subtotal, shippingMethod, coupon });
  const couponShort = coupon && subtotal < coupon.minSubtotal ? coupon.minSubtotal - subtotal : 0;

  function pickAddress(a: SavedAddress) {
    setAddressId(a.id);
    setValue("name", a.fullName, { shouldValidate: true });
    setValue("phone", a.phone, { shouldValidate: true });
    setValue("address", a.address, { shouldValidate: true });
    setValue("city", a.city, { shouldValidate: true });
    setValue("saveAddress", false);
  }

  function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    startChecking(async () => {
      const res = await previewCoupon(code, subtotal);
      if (!res.ok) {
        toast.error(
          res.reason === "minSubtotal"
            ? t("couponErrors.minSubtotal", { amount: formatPrice(res.minSubtotal ?? 0, locale) })
            : t(`couponErrors.${res.reason}`),
        );
        return;
      }
      setCoupon(res.rule);
      setCouponInput("");
      toast.success(t("couponApplied", { code: res.rule.code }));
    });
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const res = await placeOrder(
        { ...values, couponCode: coupon && !couponShort ? coupon.code : null },
        items.map((i) => ({ productId: i.productId, colorHex: i.color.hex, size: i.size, quantity: i.quantity })),
        locale,
      );
      if (res.ok) {
        clear();
        if (res.redirectUrl) {
          window.location.href = res.redirectUrl;
          return;
        }
        router.push(`/checkout/success?code=${res.code}`);
      } else if (res.error === "stock") {
        toast.error(t("errors.stock", { name: res.productName ?? "" }));
      } else if (res.error === "coupon") {
        setCoupon(null);
        toast.error(t(`couponErrors.${res.reason ?? "notFound"}`, { amount: "" }));
      } else if (res.error === "express") {
        toast.error(t("errors.express"));
      } else if (res.error === "payment") {
        toast.error(t("errors.payment"));
      } else {
        toast.error(t("errors.generic"));
      }
    });
  });

  if (!mounted) {
    return <div className="skeleton h-[600px] rounded-3xl" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-subtle px-6 py-24 text-center">
        <p className="font-display text-3xl">{t("emptyCart")}</p>
        <Link href="/shop" className={buttonClasses({ className: "mt-8" })}>
          {t("backHome")}
        </Link>
      </div>
    );
  }

  const err = (key: keyof CheckoutInput) => {
    const msg = formState.errors[key]?.message;
    return msg ? t(`errors.${msg}` as "errors.name") : undefined;
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-14">
      <div className="space-y-10">
        {!signedIn ? (
          <p className="rounded-2xl bg-subtle px-5 py-4 text-sm">
            {t("loginHint")}{" "}
            <Link href="/login?redirect=/checkout" className="font-medium underline underline-offset-4">
              →
            </Link>
          </p>
        ) : null}

        <Section step={1} title={t("contact")}>
          {addresses.length ? (
            <div className="mb-5">
              <p className="mb-2 text-sm text-muted">{t("savedAddresses")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => pickAddress(a)}
                    aria-pressed={addressId === a.id}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-3.5 text-left text-sm transition-colors",
                      addressId === a.id ? "border-foreground bg-card" : "border-border hover:border-foreground/50",
                    )}
                  >
                    <MapPin size={16} className={cn("mt-0.5 shrink-0", addressId === a.id ? "text-accent" : "text-muted")} />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {a.fullName} {a.label ? <span className="font-normal text-muted">· {a.label}</span> : null}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {a.address}, {a.city}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2" onChange={() => setAddressId(null)}>
            <Field label={t("name")} error={err("name")} reg={register("name")} autoComplete="name" />
            <Field label={t("phone")} error={err("phone")} reg={register("phone")} autoComplete="tel" inputMode="tel" />
            <Field label={t("email")} error={err("email")} reg={register("email")} autoComplete="email" type="email" className="sm:col-span-2" />
            <Field label={t("address")} error={err("address")} reg={register("address")} autoComplete="street-address" className="sm:col-span-2" />
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm text-muted">{t("city")}</span>
              <select {...register("city")} className="h-12 w-full rounded-xl border border-border bg-card px-4 outline-none focus:border-foreground">
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm text-muted">{t("note")}</span>
              <textarea {...register("note")} rows={3} className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 outline-none focus:border-foreground" />
            </label>
            {signedIn && addressId === null ? (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
                <input type="checkbox" {...register("saveAddress")} className="size-4 accent-[var(--accent)]" />
                {t("saveAddress")}
              </label>
            ) : null}
          </div>
        </Section>

        <Section step={2} title={t("shippingMethod")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice
              selected={shippingMethod === "standard"}
              onSelect={() => setValue("shippingMethod", "standard")}
              icon={<Truck size={20} />}
              title={t("standard")}
              meta={totals.shippingFee === 0 && shippingMethod === "standard" ? t("free") : formatPrice(SHIPPING_FEES.standard, locale)}
            />
            <Choice
              selected={shippingMethod === "express"}
              onSelect={() => canExpress && setValue("shippingMethod", "express")}
              disabled={!canExpress}
              icon={<Zap size={20} />}
              title={t("express")}
              meta={canExpress ? formatPrice(SHIPPING_FEES.express, locale) : t("expressUnavailable")}
            />
          </div>
        </Section>

        <Section step={3} title={t("payment")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice selected={paymentMethod === "cod"} onSelect={() => setValue("paymentMethod", "cod")} icon={<Banknote size={20} />} title={t("cod")} meta={t("codNote")} />
            <Choice selected={paymentMethod === "bank"} onSelect={() => setValue("paymentMethod", "bank")} icon={<QrCode size={20} />} title={t("bank")} meta={t("bankNote")} />
            {payments.vnpay ? (
              <Choice
                selected={paymentMethod === "vnpay"}
                onSelect={() => setValue("paymentMethod", "vnpay")}
                icon={<CreditCard size={20} />}
                title={t("vnpay")}
                meta={t("vnpayNote")}
                className="sm:col-span-2"
              />
            ) : null}
          </div>
        </Section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">{t("summary")}</h2>
          <ul className="mt-2 max-h-80 overflow-y-auto" data-lenis-prevent>
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <CartLine key={item.key} item={item} compact />
              ))}
            </AnimatePresence>
          </ul>

          <div className="mt-5">
            <AnimatePresence mode="wait">
              {coupon ? (
                <motion.div
                  key="applied"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "rounded-xl border border-dashed px-4 py-3 text-sm",
                    couponShort ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "border-success bg-success/10 text-success",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Tag size={16} /> {t("couponApplied", { code: coupon.code })}
                      {!couponShort && coupon.type !== "freeship" ? <b>−{formatPrice(couponDiscount(coupon, subtotal), locale)}</b> : null}
                    </span>
                    <button type="button" onClick={() => setCoupon(null)} aria-label={t("removeCoupon")}>
                      <X size={16} />
                    </button>
                  </div>
                  {couponShort ? <p className="mt-1 text-xs">{t("couponShort", { amount: formatPrice(couponShort, locale) })}</p> : null}
                </motion.div>
              ) : (
                <motion.div key="input" className="flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCoupon();
                      }
                    }}
                    placeholder={t("couponPlaceholder")}
                    aria-label={t("coupon")}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm uppercase outline-none placeholder:normal-case focus:border-foreground"
                  />
                  <button type="button" onClick={applyCoupon} disabled={checking} className="grid h-11 min-w-20 place-items-center rounded-xl bg-subtle px-4 text-sm font-medium hover:bg-border">
                    {checking ? <Loader2 size={16} className="animate-spin" /> : t("apply")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="mt-2 text-xs text-muted">MAY10 · WELCOME50K · FREESHIP</p>
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
            <Row label={t("subtotal")} value={formatPrice(totals.subtotal, locale)} />
            <Row label={t("shipping")} value={totals.shippingFee === 0 ? t("free") : formatPrice(totals.shippingFee, locale)} />
            <AnimatePresence>
              {totals.discount > 0 ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <Row label={t("discount")} value={`−${formatPrice(totals.discount, locale)}`} className="text-success" />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <div className="flex items-baseline justify-between border-t border-border pt-4">
              <dt className="font-medium">{t("total")}</dt>
              <dd className="font-display text-3xl">
                <AnimatedPrice value={totals.total} locale={locale} />
              </dd>
            </div>
          </dl>

          <button type="submit" disabled={pending} className={buttonClasses({ size: "lg", className: "mt-6 w-full" })}>
            {pending ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {t("placing")}
              </>
            ) : (
              <>
                <Lock size={16} /> {paymentMethod === "vnpay" ? t("payWithVnpay") : t("placeOrder")}
              </>
            )}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Lock size={12} /> {t("secureNote")}
          </p>
        </div>
      </aside>
    </form>
  );
}

function AnimatedPrice({ value, locale }: { value: number; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (node.textContent = formatPrice(Math.round(v), locale)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, locale]);
  return <span ref={ref}>{formatPrice(value, locale)}</span>;
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-3 font-display text-2xl">
        <span className="grid size-8 place-items-center rounded-full bg-foreground font-sans text-sm text-background">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  reg,
  className,
  ...props
}: { label: string; error?: string; reg: UseFormRegisterReturn; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      <input
        {...reg}
        {...props}
        aria-invalid={!!error}
        className={cn(
          "h-12 w-full rounded-xl border bg-card px-4 outline-none transition-colors focus:border-foreground",
          error ? "border-danger" : "border-border",
        )}
      />
      <AnimatePresence>
        {error ? (
          <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1 block text-xs text-danger">
            {error}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </label>
  );
}

function Choice({
  selected,
  onSelect,
  icon,
  title,
  meta,
  disabled,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  meta?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-foreground bg-card shadow-sm" : "border-border enabled:hover:border-foreground/50",
        className,
      )}
    >
      <span className={cn("mt-0.5 transition-colors", selected ? "text-accent" : "text-muted")}>{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {meta ? <span className="mt-0.5 block text-xs text-muted">{meta}</span> : null}
      </span>
      <span className={cn("grid size-5 place-items-center rounded-full border transition-all", selected ? "border-foreground bg-foreground text-background" : "border-border")}>
        {selected ? <Check size={12} /> : null}
      </span>
    </button>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
