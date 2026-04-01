"use client";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { useUnmount } from "@shared/useUnmount";
import { type WatchSource, type Effector } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observeWithFilter, type ObserveWithFilterOptions } from "./core";

export { observeWithFilter, type ObserveWithFilterOptions } from "./core";

export type UseObserveWithFilterOptions = ObserveWithFilterOptions;

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
export function useObserveWithFilter<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: UseObserveWithFilterOptions
): void {
  const selectorRef = useLatest(selector);
  const effectRef = useLatest(effect);

  const { dispose } = useConstant(() => {
    const selectorFn = () => toSelector(selectorRef.current as WatchSource)();
    return observeWithFilter(
      selectorFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value) => (effectRef.current as (v: any) => void)(value),
      options
    );
  });

  useUnmount(dispose);
}
