"use client";
import { useScope, toObs } from "@usels/core";
import { createTextSelection } from "./core";

export { createTextSelection } from "./core";
export type { UseTextSelectionOptions, UseTextSelectionReturn } from "./core";

export type UseTextSelection = typeof createTextSelection;
export const useTextSelection: UseTextSelection = (options = {}) => {
  return useScope(
    (opts) => {
      const opts$ = toObs(opts, { window: "opaque" });
      return createTextSelection(opts$ as never);
    },
    options as Record<string, unknown>
  );
};
