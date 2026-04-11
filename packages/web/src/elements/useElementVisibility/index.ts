"use client";
import { useScope, toObs } from "@usels/core";
import { createElementVisibility } from "./core";

export { createElementVisibility } from "./core";
export type { UseElementVisibilityOptions } from "./core";

export type UseElementVisibility = typeof createElementVisibility;
export const useElementVisibility: UseElementVisibility = (element, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { scrollTarget: "opaque" });
      return createElementVisibility(element, opts$);
    },
    options as Record<string, unknown>
  );
};
