"use client";
import { useScope, onUnmount } from "@primitives/useScope";
import { type WatchSource } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observeDebounced } from "./core";

export { observeDebounced, type ObserveDebouncedOptions } from "./core";

export type UseObserveDebounced = typeof observeDebounced;

/**
 * Runs a reactive effect debounced — fires only after `ms` milliseconds of inactivity.
 *
 * Built on `watch` — lazy by default (`immediate: false`).
 * The selector always tracks deps; only the effect is debounced.
 *
 * @param selector - Observable, array of Observables, or reactive read function.
 * @param effect   - Side-effect callback. Fires after debounce delay.
 * @param options  - `ms` (default 200), `maxWait`, `immediate`, `schedule`.
 *
 * @example
 * ```tsx twoslash
 * // @noErrors
 * import { useObserveDebounced } from "@usels/core";
 * import { observable } from "@legendapp/state";
 *
 * const query$ = observable("");
 *
 * useObserveDebounced(
 *   () => query$.get(),
 *   (value) => { console.log("search:", value); },
 *   { ms: 300 }
 * );
 * ```
 */
export const useObserveDebounced: UseObserveDebounced = (selector, effect, options = {}) => {
  return useScope(
    (p) => {
      const disposable = observeDebounced(
        () => toSelector(p.selector as WatchSource)(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (value) => (p.effect as (v: any) => void)(value),
        options
      );
      onUnmount(disposable.dispose);
      return disposable;
    },
    { selector, effect }
  );
};
