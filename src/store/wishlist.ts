"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProductCardData } from "@/lib/queries";

type WishlistState = {
  items: ProductCardData[];
  toggle: (product: ProductCardData) => boolean;
  has: (id: number) => boolean;
  remove: (id: number) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) => {
        const exists = get().items.some((p) => p.id === product.id);
        set({ items: exists ? get().items.filter((p) => p.id !== product.id) : [product, ...get().items] });
        return !exists;
      },
      has: (id) => get().items.some((p) => p.id === id),
      remove: (id) => set({ items: get().items.filter((p) => p.id !== id) }),
    }),
    { name: "may-wishlist", storage: createJSONStorage(() => localStorage) },
  ),
);
