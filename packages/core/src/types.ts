/**
 * @usels/core - Utility functions for Legend-State
 */

import type { Observable } from "@legendapp/state";

/**
 * A value that can be either a raw value or an Observable
 * Similar to VueUse's MaybeRef pattern
 *
 * @example
 * ```ts
 * const value: MaybeObservable<string> = 'hello'
 * const obs: MaybeObservable<string> = observable('hello')
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional permissive default matching VueUse's MaybeRef<any> pattern
export type MaybeObservable<T = any> = T | Observable<T>;

/**
 * Either the whole `T` can be an Observable, OR each individual property of `T` can be an Observable.
 *
 * Unlike `MaybeObservable<T>` which only wraps the outer object, `DeepMaybeObservable<T>` also
 * allows every field to independently accept `Observable<FieldType>`.
 *
 * @example
 * ```ts
 * type Options = DeepMaybeObservable<{ count: number; label: string }>
 * // All of these are valid:
 * const a: Options = { count: 1, label: 'hi' }                           // plain object
 * const b: Options = { count: observable(1), label: observable('hi') }   // per-field observables
 * const c: Options = observable({ count: 1, label: 'hi' })               // whole object observable
 * ```
 */
export type DeepMaybeObservable<T> =
  | Observable<T>
  | {
      [K in keyof T]?: MaybeObservable<NonNullable<T[K]>>;
    };

// --- TIER 0-A: Base utility types (VueUse equivalents) ---

export type Fn = () => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional "any function" type matching VueUse's AnyFn pattern
export type AnyFn = (...args: any[]) => any;
export type Arrayable<T> = T[] | T;
export type Awaitable<T> = Promise<T> | T;
export type TimerHandle = ReturnType<typeof setTimeout> | undefined;

export interface Pausable {
  readonly isActive: Observable<boolean>;
  pause: Fn;
  resume: Fn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional open-ended generic default matching VueUse's Stoppable pattern
export interface Stoppable<StartFnArgs extends any[] = any[]> {
  readonly isPending: Observable<boolean>;
  stop: Fn;
  start: (...args: StartFnArgs) => void;
}
