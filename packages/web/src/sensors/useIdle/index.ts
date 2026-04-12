"use client";
import { useScope, toObs } from "@usels/core";
import { createIdle } from "./core";

export { createIdle } from "./core";
export type { UseIdleOptions, UseIdleReturn } from "./core";

export type UseIdle = typeof createIdle;
export const useIdle: UseIdle = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createIdle(opts$);
    },
    options as Record<string, unknown>
  );
};
