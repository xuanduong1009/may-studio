"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";

// client-only memory across re-mounts: no curtain on first load or for filter changes on the same page
let lastPath: string | null = null;

/**
 * Re-mounts on every navigation. When the page actually changes, a curtain in
 * the brand colour sweeps up and off the new page; otherwise a soft fade.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // decided once per mount, without mutating anything during render (and never on the server)
  const [curtain] = useState(() => typeof window !== "undefined" && lastPath !== null && lastPath !== pathname);
  useEffect(() => {
    lastPath = pathname;
  }, [pathname]);

  return (
    <>
      {curtain ? (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-110 flex items-center justify-center bg-foreground print:hidden"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.span
            className="font-display text-5xl text-background italic"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            Mây.
          </motion.span>
        </motion.div>
      ) : null}
      <motion.div
        initial={{ opacity: 0, y: curtain ? 40 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: curtain ? 0.7 : 0.45, ease: [0.16, 1, 0.3, 1], delay: curtain ? 0.1 : 0 }}
      >
        {children}
      </motion.div>
    </>
  );
}
