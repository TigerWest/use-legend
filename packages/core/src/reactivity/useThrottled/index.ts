"use client";

import { useScope, toObs } from "@primitives/useScope";
import { createThrottled } from "./core";

export { createThrottled, type ThrottledOptions } from "./core";

// Aliases for hook consumers — single source of truth from core
export type { ThrottledOptions as UseThrottledOptions } from "./core";

/**
 * Throttle an Observable value.
 * Creates a read-only Observable that updates at most once per interval
 * when the source value changes.
 *
 * @param source$ - Source Observable to throttle.
 * @param options - Throttle configuration (ms, edges).
 * @returns A ReadonlyObservable that reflects the throttled source value.
 *
 * @example
 * ```tsx
 * const source$ = observable("hello");
 * const throttled$ = useThrottled(source$, { ms: 300 });
 * // throttled$.get() updates at most once per 300ms
 * ```
 */
export type UseThrottled = typeof createThrottled;
export const useThrottled: UseThrottled = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createThrottled(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
