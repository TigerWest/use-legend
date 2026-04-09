"use client";
import type { AnyFn, MaybeObservable, PromisifyFn } from "../../types";
import { type ThrottleFilterOptions } from "@shared/filters";
import { useScope } from "@primitives/useScope";
import { createThrottleFn } from "./core";

export { createThrottleFn } from "./core";

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
  return useScope(
    (p) => {
      const { throttledFn } = createThrottleFn(
        ((...args: Parameters<T>) => (p.fn as T)(...args)) as T,
        ms,
        options
      );
      return throttledFn;
    },
    { fn }
  );
}
