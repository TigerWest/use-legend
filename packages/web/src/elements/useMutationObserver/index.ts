"use client";
import { useScope, toObs } from "@usels/core";
import { createMutationObserver } from "./core";

export { createMutationObserver } from "./core";
export type { UseMutationObserverOptions, UseMutationObserverReturn } from "./core";

export type UseMutationObserver = typeof createMutationObserver;
export const useMutationObserver: UseMutationObserver = (target, callback, options = {}) => {
  return useScope((opts) => {
    const opts$ = toObs(opts);
    return createMutationObserver(target, callback, opts$);
  }, options);
};
