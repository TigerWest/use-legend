import { isObservable } from "@legendapp/state";
import { MaybeObservable } from "../../types";

/**
 * Extracts the value from a MaybeObservable **without** registering a tracking dependency.
 * If the value is an Observable, calls `.peek()` to extract it non-reactively.
 * Otherwise returns the value as-is.
 *
 * Use this for mount-time-only options that should not trigger re-runs when changed.
 * Prefer `get()` inside reactive contexts (`useObserve`, `useObservable`) when reactivity is needed.
 *
 * @param maybeObservable - A value that might be an Observable
 * @returns The extracted value (no tracking dependency registered)
 *
 * @example
 * ```ts
 * import { observable } from '@legendapp/state'
 * import { peek } from '@las/utils'
 *
 * const value = peek('hello')           // 'hello'
 * const obsValue = peek(observable(42)) // 42  — no dep registered
 * ```
 */
export function peek<T>(maybeObservable: MaybeObservable<T>): T;
export function peek<T>(maybeObservable: MaybeObservable<T> | undefined): T | undefined;

/**
 * Extracts a property value from a MaybeObservable object **without** registering a tracking dependency.
 *
 * @param maybeObservable - A value that might be an Observable
 * @param key - The property key to extract
 * @returns The property value, or undefined if not found
 *
 * @example
 * ```ts
 * import { observable } from '@legendapp/state'
 * import { peek } from '@las/utils'
 *
 * const obs$ = observable({ initialValue: true, rootMargin: '0px' })
 *
 * peek(obs$, 'initialValue')  // true  — no dep registered (mount-time-only read)
 * peek(obs$, 'rootMargin')    // '0px' — no dep registered
 * ```
 */
export function peek<T, K extends keyof T>(
  maybeObservable: MaybeObservable<T>,
  key: K,
): T[K] | undefined;

// Implementation
export function peek<T>(
  maybeObservable: MaybeObservable<T>,
  key?: keyof T,
): any {
  // Extract the base value without registering a tracking dependency
  const value = isObservable(maybeObservable)
    ? maybeObservable.peek()
    : maybeObservable;

  if (key === undefined) {
    return value;
  }

  if (value !== null && value !== undefined && typeof value === "object") {
    return (value as any)[key];
  }

  return undefined;
}
