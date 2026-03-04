"use client";
import type { Observable } from "@legendapp/state";
import { useMount, useObservable, useObserve } from "@legendapp/state/react";
import { useRef } from "react";
import type { MaybeObservable, TimerHandle, WidenPrimitive } from "../../types";
import { get } from "@utilities/get";
import { peek } from "@utilities/peek";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see useDebounced for rationale
  const value$ = useObservable<any>(peek(defaultValue));
  const timer = useRef<TimerHandle>(undefined);

  useObserve(() => {
    const current = value$.get();
    const def = peek(defaultValue);

    clearTimeout(timer.current);

    if (!Object.is(current, def)) {
      const ms = get(afterMs);
      timer.current = setTimeout(() => {
        value$.set(peek(defaultValue));
      }, ms);
    }
  });

  useMount(() => () => clearTimeout(timer.current));

  return value$ as unknown as Observable<WidenPrimitive<T>>;
}
