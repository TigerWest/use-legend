/**
 * @usels/core - Utility functions for Legend-State
 */

import type { Observable, ImmutableObservableBase } from "@legendapp/state";

/**
 * Observable where write methods (set, assign, delete, toggle) are removed at the type level.
 * Allows reactive reads (.get(), .peek(), .onChange()) while blocking accidental external writes.
 */
export type ReadonlyObservable<T> = ImmutableObservableBase<T>;

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
export type MaybeObservable<T = any> = T | Observable<T> | ReadonlyObservable<T>;

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
  | T
  | Observable<T>
  | ReadonlyObservable<T>
  | {
      [K in keyof T]?: MaybeObservable<NonNullable<T[K]>>;
    };

/**
 * Component props helper for observable pass-through components.
 *
 * Every prop except `children` is treated as a readonly Observable by default.
 * Pass additional `PlainKeys` for callbacks or other props that should stay as-is.
 */
export type ObservableProps<
  T extends object,
  PlainKeys extends keyof T = Extract<keyof T, "children">,
> = {
  [K in keyof T]: K extends PlainKeys ? T[K] : ReadonlyObservable<T[K]>;
};

/**
 * A single history record containing a serialized snapshot and its timestamp.
 */
export interface UseHistoryRecord<T> {
  snapshot: T;
  timestamp: number;
}

// --- TIER 0-A: Base utility types (VueUse equivalents) ---

export type Fn = () => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional "any function" type matching VueUse's AnyFn pattern
export type AnyFn = (...args: any[]) => any;
export type Arrayable<T> = T[] | T;
export type Awaitable<T> = Promise<T> | T;
export type PromisifyFn<T extends AnyFn> = (...args: Parameters<T>) => Promise<ReturnType<T>>;
export type TimerHandle = ReturnType<typeof setTimeout> | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

/**
 * Widens single literal types to their base primitive (e.g. `"x"` → `string`, `0` → `number`).
 * Union types (e.g. `"a" | "b"`) are kept as-is — only single literals are widened.
 */
export type WidenPrimitive<T> =
  IsUnion<T> extends true
    ? T
    : T extends string
      ? string
      : T extends number
        ? number
        : T extends boolean
          ? boolean
          : T;

export interface Disposable {
  dispose: () => void;
}

export interface Pausable {
  readonly isActive$: ReadonlyObservable<boolean>;
  pause: Fn;
  resume: Fn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional open-ended generic default matching VueUse's Stoppable pattern
export interface Stoppable<StartFnArgs extends any[] = any[]> {
  readonly isPending$: Observable<boolean>;
  stop: Fn;
  start: (...args: StartFnArgs) => void;
}

export interface Supportable {
  readonly isSupported$: ReadonlyObservable<boolean>;
}

/**
 * Native browser PermissionState — re-exported so consumers don't need DOM lib types directly.
 * - `"prompt"`      : user hasn't decided yet; calling the API will show a permission dialog
 * - `"granted"`     : user allowed; API is usable without a dialog
 * - `"denied"`      : user blocked; API calls will fail and no dialog will appear
 * - `"unsupported"` : the API is not supported in the current environment
 */
export type PermissionState = "denied" | "granted" | "prompt" | "unsupported";

export interface PermissionAware {
  /** Current permission state. `"unsupported"` = API not available in this environment. Never undefined. */
  readonly permissionState$: ReadonlyObservable<PermissionState>;
  /** `true` only when permissionState$ is `"granted"` */
  readonly permissionGranted$: ReadonlyObservable<boolean>;
  /** `true` when permissionState$ is `"prompt"` or `"denied"`. `"unsupported"` → false. */
  readonly needsPermission$: ReadonlyObservable<boolean>;
  /**
   * Request permission. No-op if unsupported or already granted.
   * If requestPermission throws, the error is propagated (state unchanged).
   */
  ensurePermission: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Module augmentation: allow ReadonlyObservable in Legend-State React components
// ---------------------------------------------------------------------------
// Legend-State's Selector<T> requires ObservableParam<T> (= ImmutableObservableSimple & MutableObservableSimple),
// but ReadonlyObservable intentionally omits MutableObservableSimple.
// This overload lets <Show if={readonlyObs$}> work without weakening ReadonlyObservable's type safety.
declare module "@legendapp/state/react" {
  function Show<T>(props: {
    if: ReadonlyObservable<T>;
    else?: import("react").ReactNode | (() => import("react").ReactNode);
    wrap?: (children: import("react").ReactNode) => import("react").ReactNode;
    children: import("react").ReactNode | ((value?: T) => import("react").ReactNode);
  }): import("react").ReactElement;
}
