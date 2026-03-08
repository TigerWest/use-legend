"use client";
import type { Observable } from "@legendapp/state";
import type { MaybeObservable, ReadonlyObservable } from "../../types";
import type { DebounceFilterOptions } from "@shared/filters";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { createDebounced } from "./core";
import { useUnmount } from "@legendapp/state/react";

export { createDebounced } from "./core";

/**
 * Debounce an Observable value.
 * Creates a read-only Observable that updates only after the source value
 * stops changing for the specified delay.
 *
 * @param value - Source value to debounce. Accepts a plain value or an Observable.
 * @param ms - Debounce delay in milliseconds. Accepts a plain number or an Observable<number>.
 * @param options - `edges` for leading/trailing control; `maxWait` to cap maximum delay.
 * @returns A ReadonlyObservable that reflects the debounced source value.
 *
 * @example
 * ```tsx
 * const source$ = observable("hello");
 * const debounced$ = useDebounced(source$, 300);
 * // debounced$.get() updates 300ms after source$ stops changing
 * ```
 */
export function useDebounced<T>(
  value: MaybeObservable<T>,
  ms: MaybeObservable<number> = 200,
  options: DebounceFilterOptions = {}
): ReadonlyObservable<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MaybeObservable<T> vs DeepMaybeObservable<T> mismatch with unconstrained generics
  const source$ = useMaybeObservable(value as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same reason as above
  const delay$ = useMaybeObservable(ms as any);

  const { value$, dispose } = useConstant(() =>
    createDebounced(
      source$ as unknown as Observable<T>,
      delay$ as unknown as Observable<number>,
      options
    )
  );

  useUnmount(dispose);

  return value$ as unknown as ReadonlyObservable<T>;
}
