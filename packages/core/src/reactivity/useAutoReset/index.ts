"use client";

import { useScope, toObs } from "@primitives/useScope";
import { createAutoReset } from "./core";

export { createAutoReset, type AutoResetOptions } from "./core";

// Aliases for hook consumers — single source of truth from core
export type { AutoResetOptions as UseAutoResetOptions } from "./core";

/**
 * Observable that automatically resets to a default value after a specified delay.
 * Each time the value changes, the reset timer restarts.
 *
 * @param source$ - Source Observable providing the default/reset target value.
 * @param options - Configuration options.
 * @returns A writable Observable that auto-resets to source$ value after the delay.
 *
 * @example
 * ```tsx
 * const defaultValue$ = observable("");
 * const message$ = useAutoReset(defaultValue$, { afterMs: 2000 });
 * message$.set("Saved!"); // resets to "" after 2 seconds
 * ```
 */
export type UseAutoReset = typeof createAutoReset;
export const useAutoReset: UseAutoReset = (source$, options) => {
  return useScope(
    (p) => {
      const p$ = toObs(p);
      return createAutoReset(source$, p$);
    },
    (options ?? {}) as Record<string, unknown>
  );
};
