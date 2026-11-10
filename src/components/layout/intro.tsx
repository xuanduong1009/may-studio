"use client";

import { animate, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { usePathname } from "@/i18n/navigation";

const ease = [0.76, 0, 0.24, 1] as const;

/** Fired once the intro has left, so the hero can start its own entrance. */
export const INTRO_DONE = "may:intro-done";

function finish() {
  try {
    sessionStorage.setItem("may-intro", "1");
  } catch {
    /* storage blocked */
  }
  document.documentElement.dataset.intro = "done";
  window.dispatchEvent(new Event(INTRO_DONE));
}

/** True once the intro is over (or was skipped). */
export function useIntroDone() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (document.documentElement.dataset.intro === "done") {
      setDone(true);
      return;
    }
    const on = () => setDone(true);
    window.addEventListener(INTRO_DONE, on);
    return () => window.removeEventListener(INTRO_DONE, on);
  }, []);
  return done;
}

/**
 * First-visit intro: a 0→100 counter and the wordmark, then a curtain lifts.
 * Rendered on the server so there is no flash of the page underneath; an
 * inline script in <head> hides it for returning visitors and for "reduce motion".
 */
export function Intro() {
  const lenis = useLenis();
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"count" | "leave" | "gone">("count");

  useEffect(() => {
    if (document.documentElement.dataset.intro === "done") {
      setPhase("gone");
      return;
    }
    lenis?.stop();
    window.scrollTo(0, 0);
    const controls = animate(0, 100, {
      duration: 1.6,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => setPhase("leave"),
    });
    return () => controls.stop();
  }, [lenis]);

  if (phase === "gone") return null;

  return (
    <motion.div
      id="intro"
      aria-hidden
      className="fixed inset-0 z-[120] flex flex-col justify-between bg-foreground p-6 text-background sm:p-10"
      initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
      animate={phase === "leave" ? { clipPath: "inset(0% 0% 100% 0%)" } : undefined}
      transition={{ duration: 1, ease }}
      onAnimationComplete={() => {
        if (phase !== "leave") return;
        finish();
        lenis?.start();
        setPhase("gone");
      }}
    >
      <div className="flex justify-between text-[11px] tracking-[0.3em] uppercase opacity-60">
        <span>MÂY Studio</span>
        <span>Sài Gòn · FW 2026</span>
      </div>

      <div className="-mt-[6vw] overflow-hidden pt-[6vw]">
        <motion.p
          className="font-display text-[28vw] leading-[0.8] font-medium tracking-tight sm:text-[22vw]"
          initial={{ y: "100%" }}
          animate={phase === "leave" ? { y: "-30%", opacity: 0 } : { y: "0%" }}
          transition={{ duration: phase === "leave" ? 0.8 : 1.2, ease }}
        >
          MÂY<span className="text-accent">.</span>
        </motion.p>
      </div>

      <div className="flex items-end justify-between">
        <div className="h-px w-1/2 overflow-hidden bg-background/20">
          <div className="h-full bg-background" style={{ width: `${count}%` }} />
        </div>
        <span className="font-display text-6xl tabular-nums sm:text-8xl">{count}</span>
      </div>
    </motion.div>
  );
}

/**
 * Lives in the root layout (outside the page-transition wrapper, whose
 * transform would trap a fixed overlay) and shows the intro only when the
 * visitor lands directly on the home page.
 */
export function IntroGate() {
  const pathname = usePathname();
  const [landedOnHome] = useState(() => pathname === "/");
  // no intro this session: release anything (the hero) waiting for it
  useEffect(() => {
    if (!landedOnHome && document.documentElement.dataset.intro !== "done") finish();
  }, [landedOnHome]);
  return landedOnHome ? <Intro /> : null;
}
