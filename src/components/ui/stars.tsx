import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating, className, size = 14 }: { rating: number; className?: string; size?: number }) {
  return (
    <div className={cn("relative inline-flex", className)} aria-label={`${rating.toFixed(1)} / 5`}>
      <div className="flex text-border">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <div className="absolute inset-0 flex overflow-hidden text-[#d4a24c]" style={{ width: `${(rating / 5) * 100}%` }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
        ))}
      </div>
    </div>
  );
}
