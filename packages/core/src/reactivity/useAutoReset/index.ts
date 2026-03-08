"use client";
import type { Observable } from "@legendapp/state";
import type { MaybeObservable, WidenPrimitive } from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { createAutoReset } from "./core";
import { useUnmount } from "@legendapp/state/react";

export { createAutoReset } from "./core";

/**
 * Observable that automatically resets to a default value after a specified delay.
 * Each time the value changes, the reset timer restarts.
 *
 * @param defaultValue - Initial value and reset target. Accepts a plain value or an Observable.
 * @param afterMs - Delay in milliseconds before auto-reset. Accepts a plain number or an Observable<number>. @default 1000
 * @returns A writable Observable that auto-resets to defaultValue after the delay.
 *
 * @example
 * ```tsx
 * const message$ = useAutoReset("", 2000);
 * message$.set("Saved!"); // resets to "" after 2 seconds
 * ```
 */
export function useAutoReset<T>(
  defaultValue: MaybeObservable<T>,
  afterMs: MaybeObservable<number> = 1000
): Observable<WidenPrimitive<T>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MaybeObservable<T> vs DeepMaybeObservable<T> mismatch with unconstrained generics
  const defaultValue$ = useMaybeObservable(defaultValue as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same reason as above
  const afterMs$ = useMaybeObservable(afterMs as any);

  const { value$, dispose } = useConstant(() =>
    createAutoReset(
      defaultValue$ as unknown as Observable<T>,
      afterMs$ as unknown as Observable<number>
    )
  );

  useUnmount(dispose);

  return value$;
}
