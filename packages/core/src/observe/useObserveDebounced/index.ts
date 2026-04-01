"use client";
import type { Observable } from "@legendapp/state";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { useUnmount } from "@shared/useUnmount";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { type WatchSource, type Effector } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observeDebounced, type ObserveDebouncedOptions } from "./core";

export { observeDebounced, type ObserveDebouncedOptions } from "./core";

export type UseObserveDebouncedOptions = ObserveDebouncedOptions;

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
export function useObserveDebounced<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: UseObserveDebouncedOptions = {}
): void {
  const { ms = 200, immediate, schedule, ...filterOptions } = options;
  // ms is reactive — Observable<number> or plain number both supported
  // Cast: default=200 ensures never undefined at runtime; useMaybeObservable returns Observable<T|undefined>
  const ms$ = useMaybeObservable(ms) as Observable<number>;

  const selectorRef = useLatest(selector);
  const effectRef = useLatest(effect);

  const { dispose } = useConstant(() => {
    const selectorFn = () => toSelector(selectorRef.current as WatchSource)();
    return observeDebounced(
      selectorFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value) => (effectRef.current as (v: any) => void)(value),
      { ms: ms$, immediate, schedule, ...filterOptions }
    );
  });

  useUnmount(dispose);
}
