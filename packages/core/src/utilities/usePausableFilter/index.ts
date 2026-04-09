"use client";
import { createPausableFilter } from "./core";
import { useConstant } from "@shared/useConstant";

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
export type UsePausableFilter = typeof createPausableFilter;
export const usePausableFilter: UsePausableFilter = (extendFilter, options) => {
  return useConstant(() => createPausableFilter(extendFilter, options));
};
