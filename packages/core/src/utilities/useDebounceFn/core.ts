import type { AnyFn, MaybeObservable, PromisifyFn } from "../../types";
import { createFilterWrapper, debounceFilter, type DebounceFilterOptions } from "@shared/filters";

/**
 * Core function: creates a debounced wrapper around a function.
 * No React dependency — pure JS/TS.
 *
 * The hook wrapper passes a stable forwarder (via useLatest) so the latest
 * `fn` reference is always used without recreating the debounced wrapper.
 *
 * @param fn - The function to debounce (should be stable or a forwarder).
 * @param ms - Debounce delay in milliseconds. Accepts a plain number or an
 *             Observable<number> — debounceFilter reads it reactively on each call.
 * @param options - `maxWait` to cap maximum delay.
 */
export function createDebounceFn<T extends AnyFn>(
  fn: T,
  ms: MaybeObservable<number> = 200,
  options: DebounceFilterOptions = {}
): { debouncedFn: PromisifyFn<T> } {
  const filter = debounceFilter(ms, options);
  const debouncedFn = createFilterWrapper(filter, fn) as unknown as PromisifyFn<T>;

  return {
    debouncedFn,
  };
}
