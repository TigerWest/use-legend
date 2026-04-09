"use client";
import type { Observable } from "@legendapp/state";
import { setSilently } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useConstant } from "@shared/useConstant";

export type SilentObservable<T> = Observable<T> & {
  silentSet: (value: T) => void;
};

/**
 * Observable augmented with a `silentSet` method.
 * Returns the Observable itself with an additional `silentSet` that updates
 * the value immediately without triggering listeners or re-renders.
 *
 * - `silentSet(v)` — updates value immediately, no listeners or re-renders
 * - `.set(v)` — normal Observable set (triggers listeners)
 * - `.get()` / `.peek()` — standard Observable reads (both reflect silentSet)
 *
 * @param initialValue - Initial value for the Observable.
 *
 * @example
 * ```tsx
 * const count$ = useSilentObservable(0);
 * count$.silentSet(5);  // value is now 5, no re-render
 * count$.peek();        // 5
 * count$.set(10);       // immediate: count$.get() === 10, listeners fire
 * ```
 * @deprecated
 */
export function useSilentObservable<T>(initialValue: T): SilentObservable<T> {
  const obs$ = useObservable<T>(initialValue);

  return useConstant(() => {
    return Object.assign(obs$, {
      silentSet(value: T) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSilently(obs$ as any, value);
      },
    });
  });
}
