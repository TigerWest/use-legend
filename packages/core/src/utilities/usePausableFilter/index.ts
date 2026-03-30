"use client";
import { useConstant } from "@shared/useConstant";
import type { EventFilter } from "@shared/filters";
import type { Pausable } from "../../types";
import { createPausableFilter } from "./core";

export { createPausableFilter, type PausableFilterOptions } from "./core";

/**
 * Creates a stable pausable EventFilter instance that persists across re-renders.
 *
 * Returns `{ isActive$, pause, resume, eventFilter }` — the same shape as `createPausableFilter`,
 * but guaranteed to be created once and reused for the component's lifetime.
 *
 * @param extendFilter - Optional inner EventFilter to compose with (default: bypassFilter).
 * @param options - `{ initialState: 'active' | 'paused' }` — defaults to `'active'`.
 *
 * @example
 * ```tsx twoslash
 * // @noErrors
 * import { usePausableFilter, useObserveWithFilter } from "@usels/core";
 * import { observable } from "@legendapp/state";
 *
 * const count$ = observable(0);
 *
 * function MyComponent() {
 *   const { isActive$, pause, resume, eventFilter } = usePausableFilter();
 *
 *   useObserveWithFilter(
 *     () => count$.get(),
 *     (value) => { console.log("count:", value); },
 *     { eventFilter }
 *   );
 * }
 * ```
 */
export function usePausableFilter(
  extendFilter?: EventFilter,
  options?: { initialState?: "active" | "paused" }
): Pausable & { eventFilter: EventFilter } {
  return useConstant(() => createPausableFilter(extendFilter, options));
}
