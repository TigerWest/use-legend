"use client";

import { useScope, toObs } from "@primitives/useScope";
import { createDataHistory } from "./core";

export { createDataHistory, type DataHistoryOptions, type DataHistoryReturn } from "./core";

/**
 * Automatically track undo/redo history for an Observable.
 * Extends `useManualHistory` with auto-commit on source change, pause/resume, and transaction.
 *
 * @param source$ - The Observable to track.
 * @param options - Configuration for auto-tracking, filtering, and serialization.
 *
 * @example
 * ```ts
 * const text$ = observable('hello');
 * const { undo, redo, canUndo$, pause, resume } = useDataHistory(text$);
 *
 * text$.set('world');  // auto-committed
 * undo();              // text$ → 'hello'
 * ```
 */
export type UseDataHistory = typeof createDataHistory;
export const useDataHistory: UseDataHistory = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createDataHistory(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
