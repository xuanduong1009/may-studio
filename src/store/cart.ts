"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProductColor } from "@/lib/db/schema";

export type CartItem = {
  /** productId:colorHex:size */
  key: string;
  productId: number;
  slug: string;
  nameVi: string;
  nameEn: string;
  kind: string;
  imageUrl?: string | null;
  color: ProductColor;
  size: string;
  /** display price only — the server recalculates prices when the order is placed */
  price: number;
  quantity: number;
  maxQuantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  /** increments on every add, used to trigger the cart icon bounce */
  bump: number;
  add: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      bump: 0,
      add: (item, quantity = 1) =>
        set((state) => {
          const key = `${item.productId}:${item.color.hex}:${item.size}`;
          const existing = state.items.find((i) => i.key === key);
          const items = existing
            ? state.items.map((i) =>
                i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, item.maxQuantity) } : i,
              )
            : [...state.items, { ...item, key, quantity: Math.min(quantity, item.maxQuantity) }];
          return { items, bump: state.bump + 1 };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxQuantity)) } : i,
          ),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "may-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((n, i) => n + i.price * i.quantity, 0);
}
