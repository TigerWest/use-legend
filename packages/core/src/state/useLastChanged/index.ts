"use client";
import type { Observable } from "@legendapp/state";
import type { MaybeObservable, ReadonlyObservable } from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { createLastChanged } from "./core";
import { useUnmount } from "@legendapp/state/react";

export { createLastChanged, type LastChangedOptions } from "./core";

/**
 * Track when a source value last changed.
 * Returns a read-only Observable containing the timestamp (`Date.now()`)
 * of the most recent change, or `null` if the source has not changed yet.
 *
 * @param source - Source value to watch. Accepts a plain value or an Observable.
 * @param initialValue - Initial timestamp value. Defaults to `null`.
 * @returns A ReadonlyObservable reflecting the last-changed timestamp.
 *
 * @example
 * ```tsx
 * const count$ = observable(0);
 * const lastChanged$ = useLastChanged(count$);
 * // lastChanged$.get() → null (no change yet)
 * // after count$.set(1) → lastChanged$.get() → 1715000000000 (Date.now())
 * ```
 */
export function useLastChanged<T>(
  source: MaybeObservable<T>,
  initialValue?: number | null
): ReadonlyObservable<number | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MaybeObservable<T> vs Observable<T> mismatch with unconstrained generics
  const source$ = useMaybeObservable(source as any);

  const { timestamp$, dispose } = useConstant(() =>
    createLastChanged(source$ as unknown as Observable<T>, { initialValue: initialValue ?? null })
  );

  useUnmount(dispose);

  return timestamp$ as unknown as ReadonlyObservable<number | null>;
}
