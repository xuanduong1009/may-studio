"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FitProfile } from "@/lib/fit";

/** The shopper's measurements, remembered so every product page can suggest a size. */
export const useFitProfile = create<{ profile: FitProfile | null; save: (p: FitProfile) => void; clear: () => void }>()(
  persist(
    (set) => ({
      profile: null,
      save: (profile) => set({ profile }),
      clear: () => set({ profile: null }),
    }),
    { name: "may-fit", storage: createJSONStorage(() => localStorage) },
  ),
);
