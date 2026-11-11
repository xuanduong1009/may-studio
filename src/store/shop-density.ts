"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type GridColumns = 2 | 3 | 4;

/** How many columns the shopper prefers for the shop grid on large screens (remembered). */
export const useShopDensity = create<{ cols: GridColumns; setCols: (cols: GridColumns) => void }>()(
  persist((set) => ({ cols: 3, setCols: (cols) => set({ cols }) }), { name: "may-density", storage: createJSONStorage(() => localStorage) }),
);
