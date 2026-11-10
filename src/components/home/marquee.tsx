import { Sparkle } from "lucide-react";

/** Infinite scrolling band (pure CSS, pauses on hover). */
export function Marquee({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className="group relative flex overflow-hidden border-y border-border bg-background py-5 select-none">
      <div
        className="flex shrink-0 animate-marquee items-center gap-10 pr-10 group-hover:[animation-play-state:paused]"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {[...row, ...row].map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-10 font-display text-2xl whitespace-nowrap italic sm:text-3xl">
            {item}
            <Sparkle size={18} className="text-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}
