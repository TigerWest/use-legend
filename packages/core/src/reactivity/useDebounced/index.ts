"use client";
import { useObservable, useObserve } from "@legendapp/state/react";
import type { MaybeObservable, ReadonlyObservable } from "../../types";
import { get } from "@utilities/get";
import { useDebounceFn } from "@utilities/useDebounceFn";
import type { DebounceFilterOptions } from "@shared/filters";
import { peek } from "@utilities/peek";

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
  // Legend-State's Observable<T> expands to a complex conditional union when T is
  // an unconstrained generic, losing .set() and other methods at the type level.
  // All existing hooks avoid this by using concrete types (boolean, number, etc.).
  // We use `any` internally and narrow at the return boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  const debounced$ = useObservable<any>(peek(value));

  // Debounced updater — useDebounceFn handles useRef stabilization
  const update = useDebounceFn(
    (newValue: T) => {
      debounced$.set(newValue);
    },
    ms,
    options
  );

  // Watch source changes — get(value) registers reactive dependency
  useObserve(() => {
    const current = get(value);
    update(current);
  });

  return debounced$ as unknown as ReadonlyObservable<T>;
}
