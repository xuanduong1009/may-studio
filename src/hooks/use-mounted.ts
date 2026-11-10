"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * true only after hydration. Used to avoid hydration mismatches for values
 * that only exist in the browser (cart/wishlist stored in localStorage).
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
