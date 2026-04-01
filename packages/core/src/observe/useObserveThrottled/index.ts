"use client";
import { type Observable } from "@legendapp/state";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { useUnmount } from "@shared/useUnmount";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { type WatchSource, type Effector } from "@observe/useWatch";
import { toSelector } from "@observe/useWatch/core";
import { observeThrottled, type ObserveThrottledOptions } from "./core";

export { observeThrottled, type ObserveThrottledOptions } from "./core";

export type UseObserveThrottledOptions = ObserveThrottledOptions;

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
export function useObserveThrottled<T extends WatchSource>(
  selector: T,
  effect: Effector<T>,
  options: UseObserveThrottledOptions = {}
): void {
  const { ms = 200, immediate, schedule, ...filterOptions } = options;
  // ms is reactive — Observable<number> or plain number both supported
  // Cast: default=200 ensures never undefined at runtime; useMaybeObservable returns Observable<T|undefined>
  const ms$ = useMaybeObservable(ms) as Observable<number>;

  const selectorRef = useLatest(selector);
  const effectRef = useLatest(effect);

  const { dispose } = useConstant(() => {
    const selectorFn = () => toSelector(selectorRef.current as WatchSource)();
    return observeThrottled(
      selectorFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value) => (effectRef.current as (v: any) => void)(value),
      { ms: ms$, immediate, schedule, ...filterOptions }
    );
  });

  useUnmount(dispose);
}
