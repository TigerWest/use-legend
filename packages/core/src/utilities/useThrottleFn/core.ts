import type { AnyFn, Disposable, MaybeObservable, PromisifyFn } from "../../types";
import { createFilterWrapper, throttleFilter, type ThrottleFilterOptions } from "@shared/filters";

/**
 * Core function: creates a throttled wrapper around a function.
 * No React dependency — pure JS/TS.
 *
 * The hook wrapper passes a stable forwarder (via useLatest) so the latest
 * `fn` reference is always used without recreating the throttled wrapper.
 *
 * @param fn - The function to throttle (should be stable or a forwarder).
 * @param ms - Throttle interval in milliseconds. Accepts a plain number or an
 *             Observable<number> — throttleFilter reads it reactively on each call.
 * @param options - `edges` for leading/trailing control.
 */
export function createThrottleFn<T extends AnyFn>(
  fn: T,
  ms: MaybeObservable<number> = 200,
  options: ThrottleFilterOptions = {}
): Disposable & { throttledFn: PromisifyFn<T> } {
  const filter = throttleFilter(ms, options);
  const throttledFn = createFilterWrapper(filter, fn) as unknown as PromisifyFn<T>;

  return {
    throttledFn,
    dispose: () => {},
  };
}
