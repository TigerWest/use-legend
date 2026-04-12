"use client";
import { useScope } from "@usels/core";
import { createWindowFocus } from "./core";

export { createWindowFocus } from "./core";
export type { UseWindowFocusReturn } from "./core";

/**
 * Tracks whether the browser window currently has focus as a reactive
 * `Observable<boolean>`. Updates automatically on focus/blur events.
 * SSR-safe: returns `false` when `document` is not available.
 */
export type UseWindowFocus = typeof createWindowFocus;
export const useWindowFocus: UseWindowFocus = () => {
  return useScope(() => createWindowFocus());
};
