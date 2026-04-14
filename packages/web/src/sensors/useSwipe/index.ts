"use client";
import { useScope, toObs } from "@usels/core";
import { createSwipe } from "./core";

export { createSwipe } from "./core";
export type { UseSwipeOptions, UseSwipeReturn, UseSwipeDirection } from "./core";

export type UseSwipe = typeof createSwipe;
export const useSwipe: UseSwipe = (target, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, {
        onSwipeStart: "function",
        onSwipe: "function",
        onSwipeEnd: "function",
      });
      return createSwipe(target, opts$);
    },
    options as Record<string, unknown>
  );
};
