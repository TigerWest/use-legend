"use client";
import { useScope, toObs } from "@usels/core";
import { createElementSize } from "./core";

export { createElementSize } from "./core";
export type { UseElementSizeOptions, UseElementSizeReturn } from "./core";

export type UseElementSize = typeof createElementSize;
export const useElementSize: UseElementSize = (target, initialSize, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts);
      return createElementSize(target, initialSize, opts$);
    },
    options as Record<string, unknown>
  );
};
