"use client";

import { Check } from "lucide-react";
import { AnimatePresence, animate, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn, formatPrice } from "@/lib/utils";

/* Small building blocks of the checkout form. */

/** A price that counts to its new value when it changes. */
export function AnimatedPrice({ value, locale }: { value: number; locale: string }) {
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

export function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
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

export function Field({
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
          "h-12 w-full rounded-xl border bg-card px-4 transition-colors outline-none focus:border-foreground",
          error ? "border-danger" : "border-border",
        )}
      />
      <AnimatePresence>
        {error ? (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1 block text-xs text-danger"
          >
            {error}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </label>
  );
}

export function Choice({
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
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full border transition-all",
          selected ? "border-foreground bg-foreground text-background" : "border-border",
        )}
      >
        {selected ? <Check size={12} /> : null}
      </span>
    </button>
  );
}

export function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
