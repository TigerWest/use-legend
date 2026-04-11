"use client";
import { useScope, toObs } from "@usels/core";
import { createPreferredLanguages } from "./core";

export { createPreferredLanguages } from "./core";
export type { UsePreferredLanguagesOptions, UsePreferredLanguagesReturn } from "./core";

export type UsePreferredLanguages = typeof createPreferredLanguages;
export const usePreferredLanguages: UsePreferredLanguages = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createPreferredLanguages(opts$);
    },
    options as Record<string, unknown>
  );
};
