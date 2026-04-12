"use client";
import { useScope, toObs } from "@usels/core";
import { createPointerSwipe } from "./core";

export { createPointerSwipe } from "./core";
export type {
  UsePointerSwipeOptions,
  UsePointerSwipeReturn,
  UseSwipeDirection,
  PointerType,
} from "./core";

export type UsePointerSwipe = typeof createPointerSwipe;
export const usePointerSwipe: UsePointerSwipe = (target, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, {
        onSwipeStart: "function",
        onSwipe: "function",
        onSwipeEnd: "function",
      });
      return createPointerSwipe(target, opts$);
    },
    options as Record<string, unknown>
  );
};
