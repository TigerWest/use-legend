"use client";
import { useScope, toObs } from "@primitives/useScope";
import { createInterval } from "./core";

export { createInterval } from "./core";
export type { IntervalOptions, IntervalReturn } from "./core";

export type UseInterval = typeof createInterval;

export const useInterval: UseInterval = (intervalValue = 1000, options = {}) => {
  return useScope(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- createInterval has discriminated overloads on controls: true/false
    (scalars, opts): any => {
      const { interval: interval$ } = toObs(scalars);
      const opts$ = toObs(opts, { callback: "function" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- discriminated overload
      return createInterval(interval$, opts$ as any);
    },
    { interval: intervalValue },
    options
  );
};
