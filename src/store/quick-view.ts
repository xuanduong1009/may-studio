"use client";

import { create } from "zustand";

/** Which product the quick-view modal is showing (one modal for the whole site). */
export const useQuickView = create<{ slug: string | null; open: (slug: string) => void; close: () => void }>((set) => ({
  slug: null,
  open: (slug) => set({ slug }),
  close: () => set({ slug: null }),
}));
