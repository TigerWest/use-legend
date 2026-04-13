"use client";
import { useScope, toObs } from "@usels/core";
import { createWindowSize } from "./core";

export { createWindowSize } from "./core";
export type { UseWindowSizeOptions, UseWindowSizeReturn } from "./core";

export type UseWindowSize = typeof createWindowSize;
export const useWindowSize: UseWindowSize = (options) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createWindowSize(opts$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
