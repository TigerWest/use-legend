"use client";
import { useScope, toObs } from "@usels/core";
import { createScrollLock } from "./core";

export { createScrollLock } from "./core";
export type { UseScrollLockReturn } from "./core";

export type UseScrollLock = typeof createScrollLock;
export const useScrollLock: UseScrollLock = (element, initialState, options) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createScrollLock(element, initialState, opts$ as never);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
