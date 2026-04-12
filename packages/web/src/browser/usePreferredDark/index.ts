"use client";
import { useScope, toObs } from "@usels/core";
import { createPreferredDark } from "./core";

export { createPreferredDark } from "./core";
export type { UsePreferredDarkReturn } from "./core";
export type { UseMediaQueryOptions } from "../useMediaQuery/core";

export type UsePreferredDark = typeof createPreferredDark;
export const usePreferredDark: UsePreferredDark = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createPreferredDark(opts$);
    },
    options as Record<string, unknown>
  );
};
