"use client";

import { useScope, toObs } from "@primitives/useScope";
import { createDebounced } from "./core";

export { createDebounced, type DebouncedOptions } from "./core";

// Aliases for hook consumers — single source of truth from core
export type { DebouncedOptions as UseDebouncedOptions } from "./core";

/**
 * Debounce an Observable value.
 * Creates a read-only Observable that updates only after the source value
 * stops changing for the specified delay.
 *
 * @param source$ - Source Observable to debounce.
 * @param options - Debounce configuration (ms, maxWait).
 * @returns A ReadonlyObservable that reflects the debounced source value.
 *
 * @example
 * ```tsx
 * const source$ = observable("hello");
 * const debounced$ = useDebounced(source$, { ms: 300 });
 * // debounced$.get() updates 300ms after source$ stops changing
 * ```
 */
export type UseDebounced = typeof createDebounced;
export const useDebounced: UseDebounced = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createDebounced(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
