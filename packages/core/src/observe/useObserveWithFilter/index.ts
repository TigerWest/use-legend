"use client";
import { useScope } from "@primitives/useScope";
import { type WatchSource } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observeWithFilter } from "./core";

export { observeWithFilter, type ObserveWithFilterOptions } from "./core";

export type UseObserveWithFilter = typeof observeWithFilter;

/**
 * Runs a reactive effect through an EventFilter, controlling when the effect fires.
 *
 * Built on `watch` — lazy by default (`immediate: false`), with full `WatchOptions` support.
 * The selector always tracks deps on every change; only the effect is gated by the filter.
 *
 * @param selector - Observable, array of Observables, or reactive read function.
 * @param effect   - Side-effect callback. Execution is controlled by `eventFilter`.
 * @param options  - `{ eventFilter, immediate?, schedule? }`
 *
 * @example
 * ```tsx twoslash
 * // @noErrors
 * import { useObserveWithFilter, createPausableFilter } from "@usels/core";
 * import { observable } from "@legendapp/state";
 *
 * const count$ = observable(0);
 * const { pause, resume, eventFilter } = createPausableFilter();
 *
 * useObserveWithFilter(
 *   () => count$.get(),
 *   (value) => { console.log("count:", value); },
 *   { eventFilter }
 * );
 * ```
 */
export const useObserveWithFilter: UseObserveWithFilter = (selector, effect, options) => {
  return useScope(
    (p) => {
      const disposable = observeWithFilter(
        () => toSelector(p.selector as WatchSource)(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (value) => (p.effect as (v: any) => void)(value),
        options
      );
      return disposable;
    },
    { selector, effect }
  );
};
