"use client";
import { useScope, toObs } from "@usels/core";
import { createCssVar } from "./core";

export { createCssVar } from "./core";
export type { UseCssVarOptions, UseCssVarReturn } from "./core";

export type UseCssVar = typeof createCssVar;
export const useCssVar: UseCssVar = (prop, target, options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createCssVar(prop, target, opts$);
    },
    options as Record<string, unknown>
  );
};
