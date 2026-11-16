"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Main image with a hover magnifier that follows the cursor. */
export function ZoomImage({
  children,
  refEl,
  onOpen,
  onSwipe,
}: {
  children: React.ReactNode;
  refEl: React.RefObject<HTMLDivElement | null>;
  onOpen?: () => void;
  onSwipe: (dir: number) => void;
}) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const touch = useRef<{ x: number; moved: boolean } | null>(null);
  return (
    <div
      ref={refEl}
      data-cursor="Zoom"
      className="group/zoom relative aspect-[3/4] flex-1 cursor-zoom-in touch-pan-y overflow-hidden rounded-3xl bg-[#efe8dd] dark:bg-subtle"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        if (touch.current?.moved) return;
        onOpen?.();
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") touch.current = { x: e.clientX, moved: false };
      }}
      onPointerUp={(e) => {
        const start = touch.current;
        if (!start || e.pointerType === "mouse") return;
        const dx = e.clientX - start.x;
        if (Math.abs(dx) > 40) {
          start.moved = true;
          onSwipe(dx < 0 ? 1 : -1);
        }
        setTimeout(() => (touch.current = null), 0);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onPointerLeave={() => setZoom(null)}
    >
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{
          transform: zoom ? "scale(1.9)" : "scale(1)",
          transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function GalleryArrow({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[#1a1714] opacity-0 shadow-sm backdrop-blur transition-opacity group-hover/zoom:opacity-100 focus-visible:opacity-100 max-lg:hidden",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      {side === "left" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
  );
}
