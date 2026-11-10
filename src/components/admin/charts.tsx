"use client";

import { animate, motion, useInView } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/utils";

/** Reads design tokens from CSS so the chart follows light/dark mode. */
function useTokens() {
  const { resolvedTheme } = useTheme();
  const [tokens, setTokens] = useState({ accent: "#b65a3c", muted: "#6f6a61", border: "#e4ddd1", card: "#fff", fg: "#1c1a17" });
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const get = (n: string) => css.getPropertyValue(n).trim();
    setTokens({ accent: get("--accent"), muted: get("--muted"), border: get("--border"), card: get("--card"), fg: get("--foreground") });
  }, [resolvedTheme]);
  return tokens;
}

export function RevenueChart({ data, locale }: { data: { date: string; revenue: number; orders: number }[]; locale: string }) {
  const c = useTokens();
  const short = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(v));
  const day = (d: string) => {
    const [, m, dd] = d.split("-");
    return locale === "vi" ? `${dd}/${m}` : `${m}/${dd}`;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.accent} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={c.border} strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={day} tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tickFormatter={short} tick={{ fill: c.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            cursor={{ stroke: c.muted, strokeDasharray: "4 4" }}
            contentStyle={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, color: c.fg, fontSize: 12 }}
            labelFormatter={(label) => day(String(label))}
            formatter={(value, name) => [name === "revenue" ? formatPrice(Number(value), locale) : String(value), name === "revenue" ? (locale === "vi" ? "Doanh thu" : "Revenue") : name]}
          />
          <Area type="monotone" dataKey="revenue" stroke={c.accent} strokeWidth={2.5} fill="url(#rev)" animationDuration={1400} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Number that counts up when it scrolls into view. */
export function CountUp({ value, format = "number", locale }: { value: number; format?: "number" | "price"; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const fmt = (v: number) => (format === "price" ? formatPrice(Math.round(v), locale) : Math.round(v).toLocaleString(locale === "vi" ? "vi-VN" : "en-US"));

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => (node.textContent = fmt(v)) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);

  return <span ref={ref}>{fmt(0)}</span>;
}

export function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-subtle">
      <motion.div
        className={className ?? "h-full rounded-full bg-accent"}
        initial={{ width: 0 }}
        whileInView={{ width: `${max ? (value / max) * 100 : 0}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
