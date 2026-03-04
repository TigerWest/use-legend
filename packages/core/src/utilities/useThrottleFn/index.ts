"use client";
import type { AnyFn, MaybeObservable, PromisifyFn } from "../../types";
import { createFilterWrapper, throttleFilter, type ThrottleFilterOptions } from "@shared/filters";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";

/**
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll.
 *
 * @param fn - The function to throttle.
 * @param ms - Throttle interval in milliseconds. Accepts a plain number or an Observable<number>.
 * @param options - `edges` for leading/trailing control.
 * @returns A throttled version of `fn` that returns a Promise resolving with the original return value.
 *
 * @example
 * ```tsx
 * const throttledFn = useThrottleFn((value: string) => {
 *   console.log(value);
 * }, 300);
 *
 * throttledFn("hello"); // fires immediately, then at most once per 300ms
 * ```
 */
export function useThrottleFn<T extends AnyFn>(
  fn: T,
  ms: MaybeObservable<number> = 200,
  options: ThrottleFilterOptions = {}
): PromisifyFn<T> {
  const fnRef = useLatest(fn);

  const wrapped = useConstant<PromisifyFn<T>>(() => {
    const filter = throttleFilter(ms, options);
    return createFilterWrapper(filter, ((...args: Parameters<T>) =>
      fnRef.current(...args)) as T) as unknown as PromisifyFn<T>;
  });

  return wrapped;
}
