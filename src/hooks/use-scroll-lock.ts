"use client";

import { useLenis } from "lenis/react";
import { useEffect } from "react";

/** Pauses the smooth-scrolling page behind an overlay (drawer, modal, sheet) while it is open. */
export function useScrollLock(locked: boolean) {
  const lenis = useLenis();
  useEffect(() => {
    if (locked) lenis?.stop();
    else lenis?.start();
  }, [locked, lenis]);
}
