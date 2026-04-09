"use client";
import { useScope, onUnmount } from "@primitives/useScope";
import { type WatchSource } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observeThrottled } from "./core";

export { observeThrottled, type ObserveThrottledOptions } from "./core";

export type UseObserveThrottled = typeof observeThrottled;

/**
 * Runs a reactive effect throttled — fires at most once per `ms` milliseconds.
 *
 * Built on `watch` — lazy by default (`immediate: false`).
 * The selector always tracks deps; only the effect is throttled.
 *
 * @param selector - Observable, array of Observables, or reactive read function.
 * @param effect   - Side-effect callback. Throttled. Always uses the latest closure.
 * @param options  - `ms` (default 200), `edges`, `immediate`, `schedule`.
 *
 * @example
 * ```tsx twoslash
 * // @noErrors
 * import { useObserveThrottled } from "@usels/core";
 * import { observable } from "@legendapp/state";
 *
 * const position$ = observable({ x: 0, y: 0 });
 *
 * useObserveThrottled(
 *   () => position$.get(),
 *   (value) => { console.log("position:", value); },
 *   { ms: 100 }
 * );
 * ```
 */
export const useObserveThrottled: UseObserveThrottled = (selector, effect, options = {}) => {
  return useScope(
    (p) => {
      const disposable = observeThrottled(
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
