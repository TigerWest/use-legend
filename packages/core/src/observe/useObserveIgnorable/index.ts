"use client";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { useUnmount } from "@shared/useUnmount";
import { type WatchSource, type Effector } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import type { ReadonlyObservable } from "../../types";
import { observeIgnorable } from "./core";
import type { WatchOptions } from "@observe/useWatch";

export { observeIgnorable, type ObserveIgnorableReturn } from "./core";

export type UseObserveIgnorableOptions = WatchOptions;

export interface UseObserveIgnorableReturn {
  ignoreUpdates: (updater: () => void) => void;
  isIgnoring$: ReadonlyObservable<boolean>;
}

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
 * @returns `{ ignoreUpdates, isIgnoring$ }`
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
export function useObserveIgnorable<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: UseObserveIgnorableOptions = {}
): UseObserveIgnorableReturn {
  const selectorRef = useLatest(selector);
  const effectRef = useLatest(effect);

  const { dispose, ignoreUpdates, isIgnoring$ } = useConstant(() => {
    const selectorFn = () => toSelector(selectorRef.current as WatchSource)();
    return observeIgnorable(
      selectorFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value) => (effectRef.current as (v: any) => void)(value),
      options
    );
  });

  useUnmount(dispose);
  return { ignoreUpdates, isIgnoring$ };
}
