"use client";
import type { AnyFn, MaybeObservable, PromisifyFn } from "../../types";
import { type DebounceFilterOptions } from "@shared/filters";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { createDebounceFn } from "./core";

export { createDebounceFn } from "./core";

/**
 * Debounce execution of a function.
 *
 * @param fn - The function to debounce.
 * @param ms - Debounce delay in milliseconds. Accepts a plain number or an Observable<number>.
 * @param options - `maxWait` to cap maximum delay.
 * @returns A debounced version of `fn` that returns a Promise resolving with the original return value.
 *
 * @example
 * ```tsx
 * const debouncedFn = useDebounceFn((value: string) => {
 *   console.log(value);
 * }, 300);
 *
 * debouncedFn("hello"); // fires after 300ms of inactivity
 * ```
 */
export function useDebounceFn<T extends AnyFn>(
  fn: T,
  ms: MaybeObservable<number> = 200,
  options: DebounceFilterOptions = {}
): PromisifyFn<T> {
  const fnRef = useLatest(fn);

  const { debouncedFn } = useConstant(() =>
    createDebounceFn(((...args: Parameters<T>) => fnRef.current(...args)) as T, ms, options)
  );

  return debouncedFn;
}
