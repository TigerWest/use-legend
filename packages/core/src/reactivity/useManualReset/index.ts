"use client";
import type { Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useCallback } from "react";
import type { Fn, MaybeObservable, WidenPrimitive } from "../../types";
import { peek } from "@utilities/peek";

/**
 * Observable with a manual `reset()` function that restores the value to its default.
 *
 * @param defaultValue - Initial value and reset target. Accepts a plain value or an Observable.
 * @returns `{ value$, reset }` — writable Observable and a reset function.
 *
 * @example
 * ```tsx
 * const { value$, reset } = useManualReset("hello");
 * value$.set("changed");
 * reset(); // value$.get() === "hello"
 * ```
 */
export function useManualReset<T>(defaultValue: MaybeObservable<T>): {
  value$: Observable<WidenPrimitive<T>>;
  reset: Fn;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see useAutoReset for rationale
  const value$ = useObservable<any>(peek(defaultValue));

  const reset = useCallback(() => {
    value$.set(peek(defaultValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { value$: value$ as unknown as Observable<WidenPrimitive<T>>, reset };
}
