"use client";

/**
 * Animates a snapshot of `source` flying into the cart icon in the header.
 * Uses the Web Animations API, so it costs nothing when it is not running.
 */
export function flyToCart(source: HTMLElement | null) {
  if (!source || typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();

  const clone = source.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    zIndex: "9999",
    pointerEvents: "none",
    borderRadius: "1rem",
    overflow: "hidden",
    boxShadow: "0 20px 50px -10px rgba(0,0,0,.35)",
  });
  document.body.appendChild(clone);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = Math.max(0.06, 28 / from.width);

  const anim = clone.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 80}px) scale(0.55) rotate(-8deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(12deg)`, opacity: 0.4, offset: 1 },
    ],
    { duration: 850, easing: "cubic-bezier(.55,.06,.3,1)" },
  );
  anim.onfinish = () => clone.remove();
}
