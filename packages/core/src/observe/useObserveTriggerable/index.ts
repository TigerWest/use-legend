"use client";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { useUnmount } from "@shared/useUnmount";
import { type WatchSource, type Effector } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import type { WatchOptions } from "@observe/useWatch";
import { observeTriggerable } from "./core";

export { observeTriggerable, type ObserveTriggerableReturn } from "./core";

export type UseObserveTriggerableOptions = WatchOptions;

export interface UseObserveTriggerableReturn {
  ignoreUpdates: (updater: () => void) => void;
  trigger: () => void;
}

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
 * @returns `{ ignoreUpdates, trigger }`
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
export function useObserveTriggerable<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: UseObserveTriggerableOptions = {}
): UseObserveTriggerableReturn {
  const selectorRef = useLatest(selector);
  const effectRef = useLatest(effect);

  const { dispose, ignoreUpdates, trigger } = useConstant(() => {
    const selectorFn = () => toSelector(selectorRef.current as WatchSource)();
    return observeTriggerable(
      selectorFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value) => (effectRef.current as (v: any) => void)(value),
      options
    );
  });

  useUnmount(dispose);
  return { ignoreUpdates, trigger };
}
