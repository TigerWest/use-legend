"use client";
import { useScope, toObs } from "@usels/core";
import { createWindowScroll } from "./core";

export { createWindowScroll } from "./core";
export type { UseWindowScrollOptions, UseWindowScrollReturn } from "./core";
// Re-export UseScroll option/return type names (legacy alias) so existing
// consumers that import them from `useWindowScroll` keep working.
export type { UseScrollOptions, UseScrollReturn } from "../useScroll/core";

export type UseWindowScroll = typeof createWindowScroll;
export const useWindowScroll: UseWindowScroll = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, {
        window: "opaque",
      });
      return createWindowScroll(opts$ as never);
    },
    options as Record<string, unknown>
  );
};
