"use client";
import type { Observable } from "@legendapp/state";
import type { Fn, MaybeObservable, WidenPrimitive } from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { createManualReset } from "./core";
import { useUnmount } from "@legendapp/state/react";

export { createManualReset } from "./core";

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
  const defaultValue$ = useMaybeObservable(defaultValue);

  const { value$, reset, dispose } = useConstant(() =>
    createManualReset(defaultValue$ as unknown as Observable<T>)
  );

  useUnmount(dispose);

  return { value$, reset };
}
