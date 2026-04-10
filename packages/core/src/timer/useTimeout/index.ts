"use client";
import { useScope, toObs } from "@primitives/useScope";
import { createTimeout } from "./core";

export { createTimeout } from "./core";
export type { TimeoutOptions, TimeoutReturn } from "./core";

export type UseTimeout = typeof createTimeout;

export const useTimeout: UseTimeout = (intervalValue = 1000, options = {}) => {
  return useScope(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- createTimeout has discriminated overloads on controls: true/false
    (scalars, opts): any => {
      const { interval: interval$ } = toObs(scalars);
      const opts$ = toObs(opts, { callback: "function" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- discriminated overload
      return createTimeout(interval$ as any, opts$ as any);
    },
    { interval: intervalValue },
    options
  );
};
