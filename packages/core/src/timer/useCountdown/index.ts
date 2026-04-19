"use client";
import { useScope, toObs } from "@primitives/useScope";
import { createCountdown } from "./core";

export { createCountdown } from "./core";
export type { CountdownOptions, CountdownReturn } from "./core";

export type UseCountdown = typeof createCountdown;

export const useCountdown: UseCountdown = (initialCount, options = {}) => {
  return useScope((opts) => {
    const opts$ = toObs(opts);
    return createCountdown(initialCount, opts$);
  }, options);
};
