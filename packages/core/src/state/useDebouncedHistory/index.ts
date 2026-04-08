"use client";

import { useScope, toObs } from "@primitives/useScope";
import { createDebouncedHistory } from "./core";

export { createDebouncedHistory, type DebouncedHistoryOptions } from "./core";

// Aliases for hook consumers — single source of truth from core
export type { DebouncedHistoryOptions as UseDebouncedHistoryOptions } from "./core";
export type { DataHistoryReturn as UseDebouncedHistoryReturn } from "../useDataHistory/core";

/**
 * Track undo/redo history with debounced auto-commit.
 * Records a snapshot only after the source stops changing for `debounce` ms.
 * Ideal for text inputs, search boxes, and other "commit when idle" patterns.
 *
 * @param source$ - The Observable to track.
 * @param options - Debounce timing and history configuration.
 *
 * @example
 * ```ts
 * const search$ = observable('');
 * const { undo, redo } = useDebouncedHistory(search$, { debounce: 500 });
 * ```
 */
export type UseDebouncedHistory = typeof createDebouncedHistory;
export const useDebouncedHistory: UseDebouncedHistory = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p, { dump: "function", parse: "function", shouldCommit: "function" });
      return createDebouncedHistory(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
