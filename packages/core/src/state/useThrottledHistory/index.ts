"use client";

import { useScope, toObs } from "@primitives/useScope";
import { createThrottledHistory } from "./core";

export { createThrottledHistory, type ThrottledHistoryOptions } from "./core";
export type { DataHistoryReturn } from "../useDataHistory/core";

/**
 * Track undo/redo history with throttled auto-commit.
 * Ideal for sliders, drag operations, and other rapid-fire value changes
 * where recording every intermediate value would bloat the history.
 *
 * @param source$ - The Observable to track.
 * @param options - Throttle timing and history configuration.
 *
 * @example
 * ```ts
 * const slider$ = observable(50);
 * const { undo, redo } = useThrottledHistory(slider$, { throttle: 300 });
 * ```
 */
export type UseThrottledHistory = typeof createThrottledHistory;
export const useThrottledHistory: UseThrottledHistory = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p, { dump: "function", parse: "function", shouldCommit: "function" });
      return createThrottledHistory(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
