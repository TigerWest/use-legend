"use client";
import { useScope, toObs } from "@usels/core";
import { createFocus } from "./core";

export { createFocus } from "./core";
export type { UseFocusOptions, UseFocusReturn } from "./core";

export type UseFocus = typeof createFocus;
export const useFocus: UseFocus = (target, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createFocus(target, opts$);
    },
    options as Record<string, unknown>
  );
};
