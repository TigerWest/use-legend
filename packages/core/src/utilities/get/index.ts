import { isObservable } from "@legendapp/state";
import type { DeepMaybeObservable, MaybeObservable } from "../../types";

/**
 * Extracts the value from a MaybeObservable
 * If the value is an Observable, calls .get() to extract it
 * Otherwise returns the value as-is
 *
 * @param maybeObservable - A value that might be an Observable
 * @returns The extracted value
 *
 * @example
 * ```ts
 * import { observable } from '@legendapp/state'
 * import { get } from '@usels/core'
 *
 * const value = get('hello')           // 'hello'
 * const obsValue = get(observable(42)) // 42
 * ```
 */
export function get<T>(v: { get(): T }): T;
export function get<T extends object>(v: DeepMaybeObservable<T>): T;
export function get<T extends object>(v: DeepMaybeObservable<T> | undefined): T | undefined;
export function get<T>(maybeObservable: MaybeObservable<T>): T;
export function get<T>(maybeObservable: MaybeObservable<T> | undefined): T | undefined;

/**
 * Extracts a property value from a MaybeObservable object
 *
 * @param maybeObservable - A value that might be an Observable
 * @param key - The property key to extract
 * @returns The property value, or undefined if not found
 *
 * @example
 * ```ts
 * import { observable } from '@legendapp/state'
 * import { get } from '@usels/core'
 *
 * const obj = { name: 'John' }
 * const obs$ = observable({ name: 'Jane' })
 *
 * get(obj, 'name')    // 'John'
 * get(obs$, 'name')   // 'Jane'
 * get(obs$, 'age')    // undefined
 * ```
 */
export function get<T, K extends keyof T>(
  maybeObservable: MaybeObservable<T>,
  key: K
): T[K] | undefined;

// Implementation — uses any to cover all overload signatures (DeepMaybeObservable is wider than MaybeObservable)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function get(maybeObservable: any, key?: any): any {
  // Extract the base value
  const value = isObservable(maybeObservable) ? maybeObservable.get() : maybeObservable;

  // If no key provided, return the value (single-arg overload)
  if (key === undefined) {
    return value;
  }

  // If key provided, extract property (two-arg overload)
  if (value !== null && value !== undefined && typeof value === "object") {
    return value[key];
  }

  return undefined;
}
