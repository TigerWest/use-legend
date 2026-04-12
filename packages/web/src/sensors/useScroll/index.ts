"use client";
import { useScope, toObs } from "@usels/core";
import { createScroll } from "./core";

export { createScroll } from "./core";
export type { UseScrollOptions, UseScrollReturn, ArrivedState, ScrollDirections } from "./core";

export type UseScroll = typeof createScroll;
export const useScroll: UseScroll = (element, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, {
        onScroll: "function",
        onStop: "function",
        onError: "function",
        window: "opaque",
      });
      return createScroll(element, opts$ as never);
    },
    options as Record<string, unknown>
  );
};
