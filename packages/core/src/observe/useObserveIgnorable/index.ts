"use client";
import { useScope, onUnmount } from "@primitives/useScope";
import { type WatchSource } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observeIgnorable } from "./core";

export { observeIgnorable, type ObserveIgnorableReturn } from "./core";

export type UseObserveIgnorable = typeof observeIgnorable;

/**
 * Runs a reactive effect with an `ignoreUpdates` escape hatch to suppress circular triggers.
 *
 * Built on `watch` — lazy by default (`immediate: false`).
 * Changes made inside `ignoreUpdates(updater)` do not trigger the effect.
 * Useful for two-way bindings where you need to break update cycles.
 *
 * @param selector - Observable, array of Observables, or reactive read function.
 * @param effect   - Side-effect callback. Suppressed when triggered via `ignoreUpdates`.
 * @param options  - `{ immediate?, schedule? }`
 * @returns `{ ignoreUpdates, isIgnoring$, dispose }`
 *
 * @example
 * ```tsx twoslash
 * // @noErrors
 * import { useObserveIgnorable } from "@usels/core";
 * import { observable } from "@legendapp/state";
 *
 * const source$ = observable(0);
 *
 * const { ignoreUpdates, isIgnoring$ } = useObserveIgnorable(
 *   () => source$.get(),
 *   (value) => { console.log("source:", value); }
 * );
 *
 * // Update source without triggering the effect
 * ignoreUpdates(() => { source$.set(42); });
 * ```
 */
export const useObserveIgnorable: UseObserveIgnorable = (selector, effect, options = {}) => {
  return useScope(
    (p) => {
      const disposable = observeIgnorable(
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
