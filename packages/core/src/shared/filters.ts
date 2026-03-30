// ---------------------------------------------------------------------------
// TIER 0-D: EventFilter system
// VueUse shared/utils/filters.ts → LSA 변환
// MaybeRefOrGetter<number> → MaybeObservable<number> (toValue() → get())
// toRef(bool) → observable(bool), readonly(ref) → Legend State Observable
// ---------------------------------------------------------------------------

import { debounce, throttle } from "es-toolkit";
import type { AnyFn, Awaitable, MaybeObservable } from "../types";
import { peek } from "@utilities/peek";
import { noop } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic event filter, matches VueUse pattern
export type EventFilter<Args extends any[] = any[], This = any, Return = void> = (
  invoke: () => Return,
  options: { fn: AnyFn; args: Args; thisArg: This }
) => Awaitable<Return>;

export interface ConfigurableEventFilter {
  eventFilter?: EventFilter;
}

/**
 * Controls which edges trigger the debounced invocation.
 * Maps directly to es-toolkit's `DebounceOptions.edges`.
 * Defaults to `["trailing"]` when omitted.
 */
export interface DebounceFilterOptions {
  edges?: Array<"leading" | "trailing">;
  /**
   * Maximum time in milliseconds to wait before forcing invocation,
   * regardless of how frequently the debounced function is called.
   * Accepts a plain number or an Observable<number>.
   *
   * @example
   * debounceFilter(300, { maxWait: 1000 })
   * // Fires at most every 1000ms even if calls keep coming in
   */
  maxWait?: MaybeObservable<number | undefined>;
}

/**
 * Controls which edges trigger the throttled invocation.
 * Maps directly to es-toolkit's `ThrottleOptions.edges`.
 * Defaults to `["leading", "trailing"]` when omitted.
 */
export interface ThrottleFilterOptions {
  edges?: Array<"leading" | "trailing">;
}

/**
 * Wraps a function with an EventFilter to control when it fires.
 *
 * @example
 * ```ts
 * const debouncedFn = createFilterWrapper(debounceFilter(300), myFn)
 * debouncedFn() // invocation is debounced by 300ms
 * ```
 */
export function createFilterWrapper<T extends AnyFn>(filter: EventFilter, fn: T): T {
  function wrapper(this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      // Cast to Promise<any>: EventFilter defaults to Return=void, but the resolved
      // value is actually ReturnType<T> at runtime.
      (
        Promise.resolve(
          filter(() => fn.apply(this, args) as ReturnType<T>, { fn, args, thisArg: this })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as Promise<any>
      ).then(resolve, reject);
    });
  }
  return wrapper as unknown as T;
}

/**
 * A no-op EventFilter that invokes the function immediately without any delay.
 */
export const bypassFilter: EventFilter = (invoke) => invoke();

/**
 * Creates an EventFilter that debounces invocations using es-toolkit's debounce.
 * Supports reactive `ms` via MaybeObservable<number> — duration is re-read on each call.
 *
 * All intermediate (superseded) Promises resolve with the same final result,
 * matching VueUse's `rejectOnCancel: false` semantics.
 *
 * @param ms - Debounce delay in milliseconds. Accepts a plain number or an Observable<number>.
 * @param options - `edges` for leading/trailing control; `maxWait` to cap maximum delay.
 *
 * @remarks
 * **React usage:** This filter holds mutable closure state (`debouncedFn`, timers).
 * Creating a new filter instance on every render resets the debounce window.
 * Always stabilise the instance with `useRef` or `useMemo`:
 * ```ts
 * const filter = useRef(debounceFilter(300)).current
 * const wrapped = useRef(createFilterWrapper(filter, fn)).current
 * ```
 *
 * @example
 * ```ts
 * const debouncedSearch = createFilterWrapper(debounceFilter(300), search)
 * // reactive delay:
 * const delay$ = observable(300)
 * const debouncedSearch = createFilterWrapper(debounceFilter(delay$), search)
 * // with maxWait guarantee:
 * const debouncedSearch = createFilterWrapper(debounceFilter(300, { maxWait: 1000 }), search)
 * ```
 */
export function debounceFilter(
  ms: MaybeObservable<number>,
  options: DebounceFilterOptions = {}
): EventFilter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- invoke captures arbitrary args via closure
  let latestInvoke: () => any = noop;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- resolve callbacks for all pending calls
  const pendingResolvers: Array<(v: any) => void> = [];
  let currentMs = -1;
  let debouncedFn: { (): void; cancel: () => void } | null = null;
  let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;

  // Stable executor: calls the latest invoke and resolves ALL pending Promises with
  // the same result — matching VueUse's rejectOnCancel: false (default) semantics.
  // Also clears the maxWait timer to prevent double execution.
  const execute = () => {
    if (maxWaitTimer) {
      clearTimeout(maxWaitTimer);
      maxWaitTimer = null;
    }
    const result = latestInvoke();
    pendingResolvers.forEach((r) => r(result));
    pendingResolvers.length = 0;
  };

  const filter: EventFilter = (invoke) => {
    // Use non-tracked reads so changing a reactive delay does not become
    // a dependency of outer observers such as useHistory's source watcher.
    const duration = peek(ms);

    // Rebuild debounced wrapper if duration changed (Observable ms support)
    if (duration !== currentMs || !debouncedFn) {
      debouncedFn?.cancel();
      debouncedFn = debounce(execute, duration, { edges: options.edges });
      currentMs = duration;
    }

    // Zero-delay: call immediately, skip Promise overhead
    if (duration <= 0) {
      return invoke();
    }

    return new Promise((resolve) => {
      pendingResolvers.push(resolve);
      latestInvoke = invoke;
      debouncedFn!();

      // Start maxWait timer on the first call of a new debounce window.
      // Forces execution if calls keep coming beyond maxWait ms.
      const maxDuration = options.maxWait !== undefined ? peek(options.maxWait) : undefined;
      if (maxDuration !== undefined && maxDuration > 0 && !maxWaitTimer) {
        maxWaitTimer = setTimeout(() => {
          maxWaitTimer = null;
          debouncedFn?.cancel();
          execute();
        }, maxDuration);
      }
    });
  };

  return filter;
}

/**
 * Creates an EventFilter that throttles invocations using es-toolkit's throttle.
 * Supports reactive `ms` via MaybeObservable<number> — duration is re-read on each call.
 *
 * Calls during the throttle window resolve with the previous result (`lastResult`),
 * matching VueUse's `lastValue` pattern.
 *
 * @param ms - Throttle interval in milliseconds. Accepts a plain number or an Observable<number>.
 * @param options - Edge control: `{ edges: ["leading", "trailing"] }` (default), or either edge alone.
 *
 * @remarks
 * **React usage:** This filter holds mutable closure state (`throttledFn`, `lastResult`).
 * Creating a new filter instance on every render resets the throttle window.
 * Always stabilise the instance with `useRef` or `useMemo`:
 * ```ts
 * const filter = useRef(throttleFilter(100)).current
 * const wrapped = useRef(createFilterWrapper(filter, fn)).current
 * ```
 *
 * @example
 * ```ts
 * const throttledScroll = createFilterWrapper(throttleFilter(100), onScroll)
 * ```
 */
export function throttleFilter(
  ms: MaybeObservable<number>,
  options: ThrottleFilterOptions = {}
): EventFilter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- invoke captures arbitrary args via closure
  let latestInvoke: () => any = noop;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cached result from last actual execution
  let lastResult: any;
  let currentMs = -1;
  let throttledFn: { (): void; cancel: () => void } | null = null;

  // Stable executor: captures lastResult so throttled calls can return the previous value.
  // Matches VueUse's lastValue pattern.
  const execute = () => {
    lastResult = latestInvoke();
    return lastResult;
  };

  const filter: EventFilter = (invoke) => {
    // Use non-tracked reads so changing a reactive interval only affects
    // the next source event instead of re-triggering outer observers.
    const duration = peek(ms);

    // Rebuild throttled wrapper if duration changed (Observable ms support)
    if (duration !== currentMs || !throttledFn) {
      throttledFn?.cancel();
      throttledFn = throttle(execute, duration, options);
      currentMs = duration;
    }

    latestInvoke = invoke;
    const result = throttledFn();
    // When throttled, es-toolkit returns undefined; fall back to lastResult (VueUse pattern).
    // On the very first call lastResult is also undefined, which is acceptable.
    return result !== undefined ? result : lastResult;
  };

  return filter;
}
