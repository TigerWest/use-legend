"use client";
import { useObservable, useObserve } from "@legendapp/state/react";
import type { MaybeObservable, ReadonlyObservable } from "../../types";
import { get } from "@utilities/get";
import { useThrottleFn } from "@utilities/useThrottleFn";
import type { ThrottleFilterOptions } from "@shared/filters";
import { peek } from "@utilities/peek";

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
  // Legend-State's Observable<T> expands to a complex conditional union when T is
  // an unconstrained generic, losing .set() and other methods at the type level.
  // We use `any` internally and narrow at the return boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  const throttled$ = useObservable<any>(peek(value));

  // Throttled updater — useThrottleFn handles useRef stabilization
  const update = useThrottleFn(
    (newValue: T) => {
      throttled$.set(newValue);
    },
    ms,
    options
  );

  // Watch source changes — get(value) registers reactive dependency
  useObserve(() => {
    const current = get(value);
    update(current);
  });

  return throttled$ as unknown as ReadonlyObservable<T>;
}
