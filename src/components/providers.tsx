"use client";

import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-center"
      mobileOffset={{ bottom: 84 }}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{ className: "!rounded-2xl !font-sans" }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {/* respects the OS "reduce motion" setting for every animation */}
      <MotionConfig reducedMotion="user">
        <ReactLenis root options={{ lerp: 0.12, smoothWheel: true }} />
        {children}
        <ThemedToaster />
      </MotionConfig>
    </ThemeProvider>
  );
}
