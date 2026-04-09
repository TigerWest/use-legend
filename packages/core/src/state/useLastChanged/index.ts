"use client";

import { useScope, toObs } from "@primitives/useScope";
import { createLastChanged } from "./core";

export { createLastChanged, type LastChangedOptions } from "./core";

/**
 * Track when a source value last changed.
 * Returns `{ timestamp$ }` — a read-only Observable containing the timestamp (`Date.now()`)
 * of the most recent change, or `null` if the source has not changed yet.
 *
 * @param source$ - Source Observable to watch.
 * @param options - Configuration options.
 * @returns `{ timestamp$ }` — Observable reflecting the last-changed timestamp.
 *
 * @example
 * ```tsx
 * const count$ = observable(0);
 * const { timestamp$ } = useLastChanged(count$);
 * // timestamp$.get() → null (no change yet)
 * // after count$.set(1) → timestamp$.get() → 1715000000000 (Date.now())
 * ```
 */
export type UseLastChanged = typeof createLastChanged;
export const useLastChanged: UseLastChanged = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createLastChanged(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
