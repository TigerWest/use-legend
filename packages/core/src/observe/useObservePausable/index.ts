"use client";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { useUnmount } from "@shared/useUnmount";
import { type WatchSource, type Effector } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import type { Pausable } from "../../types";
import { observePausable, type ObservePausableOptions } from "./core";

export { observePausable, type ObservePausableOptions } from "./core";

export type UseObservePausableOptions = ObservePausableOptions;

/**
 * Runs a reactive effect with built-in pause/resume controls.
 *
 * Built on `watch` — lazy by default (`immediate: false`).
 * The selector always tracks deps on every change; only the effect is gated by the active state.
 *
 * @param selector - Observable, array of Observables, or reactive read function.
 * @param effect   - Side-effect callback. Suppressed while paused.
 * @param options  - `{ initialState?, immediate?, schedule? }`
 * @returns `{ isActive$, pause, resume }`
 *
 * @example
 * ```tsx twoslash
 * // @noErrors
 * import { useObservePausable } from "@usels/core";
 * import { observable } from "@legendapp/state";
 *
 * const count$ = observable(0);
 *
 * const { isActive$, pause, resume } = useObservePausable(
 *   () => count$.get(),
 *   (value) => { console.log("count:", value); }
 * );
 * ```
 */
export function useObservePausable<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: UseObservePausableOptions = {}
): Pausable {
  const selectorRef = useLatest(selector);
  const effectRef = useLatest(effect);

  const { dispose, ...pausable } = useConstant(() => {
    const selectorFn = () => toSelector(selectorRef.current as WatchSource)();
    return observePausable(
      selectorFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value) => (effectRef.current as (v: any) => void)(value),
      options
    );
  });

  useUnmount(dispose);
  return pausable;
}
