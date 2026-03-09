"use client";
import type { Observable } from "@legendapp/state";
import type { MaybeObservable, ReadonlyObservable } from "../../types";
import type { ThrottleFilterOptions } from "@shared/filters";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { createThrottled } from "./core";
import { useUnmount } from "@legendapp/state/react";

export { createThrottled } from "./core";

/**
 * Throttle an Observable value.
 * Creates a read-only Observable that updates at most once per interval
 * when the source value changes.
 *
 * @param value - Source value to throttle. Accepts a plain value or an Observable.
 * @param ms - Throttle interval in milliseconds. Accepts a plain number or an Observable<number>.
 * @param options - `edges` for leading/trailing control.
 * @returns A ReadonlyObservable that reflects the throttled source value.
 *
 * @example
 * ```tsx
 * const source$ = observable("hello");
 * const throttled$ = useThrottled(source$, 300);
 * // throttled$.get() updates at most once per 300ms
 * ```
 */
export function useThrottled<T>(
  value: MaybeObservable<T>,
  ms: MaybeObservable<number> = 200,
  options: ThrottleFilterOptions = {}
): ReadonlyObservable<T> {
  const source$ = useMaybeObservable(value);
  const interval$ = useMaybeObservable(ms);

  const { value$, dispose } = useConstant(() =>
    createThrottled(
      source$ as unknown as Observable<T>,
      interval$ as unknown as Observable<number>,
      options
    )
  );

  useUnmount(dispose);

  return value$ as unknown as ReadonlyObservable<T>;
}
