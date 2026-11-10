"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ViewedProduct = {
  id: number;
  slug: string;
  nameVi: string;
  nameEn: string;
  price: number;
  compareAtPrice: number | null;
  kind: string;
  color: string;
  imageUrl: string | null;
};

type State = {
  items: ViewedProduct[];
  track: (p: ViewedProduct) => void;
  clear: () => void;
};

/** Last products the visitor opened (newest first, max 12). */
export const useRecentlyViewed = create<State>()(
  persist(
    (set) => ({
      items: [],
      track: (p) => set((s) => ({ items: [p, ...s.items.filter((x) => x.id !== p.id)].slice(0, 12) })),
      clear: () => set({ items: [] }),
    }),
    { name: "may-recent", storage: createJSONStorage(() => localStorage) },
  ),
);
