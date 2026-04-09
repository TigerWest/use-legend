"use client";
import { useScope, onUnmount } from "@primitives/useScope";
import { type WatchSource } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observeTriggerable } from "./core";

export { observeTriggerable, type ObserveTriggerableReturn } from "./core";

export type UseObserveTriggerable = typeof observeTriggerable;

/**
 * Runs a reactive effect with an `ignoreUpdates` escape hatch and a manual `trigger()` method.
 *
 * Built on `observeIgnorable` — lazy by default (`immediate: false`).
 * `trigger()` immediately executes the effect with the current selector value,
 * using `ignoreUpdates` internally to prevent recursive re-triggering.
 *
 * @param selector - Observable, array of Observables, or reactive read function.
 * @param effect   - Side-effect callback.
 * @param options  - `{ immediate?, schedule? }`
 * @returns `{ ignoreUpdates, trigger, dispose }`
 *
 * @example
 * ```tsx twoslash
 * // @noErrors
 * import { useObserveTriggerable } from "@usels/core";
 * import { observable } from "@legendapp/state";
 *
 * const source$ = observable(0);
 *
 * const { trigger, ignoreUpdates } = useObserveTriggerable(
 *   () => source$.get(),
 *   (value) => { console.log("source:", value); }
 * );
 *
 * // Manually run the effect with the current value
 * trigger();
 * ```
 */
export const useObserveTriggerable: UseObserveTriggerable = (selector, effect, options = {}) => {
  return useScope(
    (p) => {
      const disposable = observeTriggerable(
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
