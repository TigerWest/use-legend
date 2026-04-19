"use client";

import { useScope, toObs } from "@primitives/useScope";
import { createManualHistory } from "./core";

export { createManualHistory, type ManualHistoryOptions, type ManualHistoryReturn } from "./core";

/**
 * Manually manage undo/redo history for an Observable.
 * History is only recorded when `commit()` is called explicitly.
 *
 * @param source$ - The Observable to track. Must be writable (undo/redo write back to it).
 * @param options - Configuration for capacity, cloning, and serialization.
 *
 * @example
 * ```ts
 * const counter$ = observable(0);
 * const { commit, undo, redo, canUndo$ } = useManualHistory(counter$);
 *
 * counter$.set(1);
 * commit();       // snapshot: 1
 * counter$.set(2);
 * commit();       // snapshot: 2
 * undo();         // counter$ → 1
 * redo();         // counter$ → 2
 * ```
 */
export type UseManualHistory = typeof createManualHistory;
export const useManualHistory: UseManualHistory = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createManualHistory(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
