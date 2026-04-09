"use client";
import { useScope, onUnmount } from "@primitives/useScope";
import { type WatchSource } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observePausable } from "./core";

export { observePausable, type ObservePausableOptions } from "./core";

export type UseObservePausable = typeof observePausable;

/**
 * Runs a reactive effect with built-in pause/resume controls.
 *
 * Built on `watch` — lazy by default (`immediate: false`).
 * The selector always tracks deps on every change; only the effect is gated by the active state.
 *
 * @param selector - Observable, array of Observables, or reactive read function.
 * @param effect   - Side-effect callback. Suppressed while paused.
 * @param options  - `{ initialState?, immediate?, schedule? }`
 * @returns `{ isActive$, pause, resume, dispose }`
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
export const useObservePausable: UseObservePausable = (selector, effect, options = {}) => {
  return useScope(
    (p) => {
      const disposable = observePausable(
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
