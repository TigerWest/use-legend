"use client";
import { useScope, toObs } from "@usels/core";
import { createPageLeave } from "./core";

export { createPageLeave } from "./core";
export type { UsePageLeaveOptions } from "./core";

export type UsePageLeave = typeof createPageLeave;
export const usePageLeave: UsePageLeave = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createPageLeave(opts$);
    },
    options as Record<string, unknown>
  );
};
