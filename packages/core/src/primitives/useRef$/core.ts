import { createOpaque } from "../../reactivity/useOpaque/core";
import type { ReadonlyObservable } from "../../types";
import type { Disposable } from "../../types";

export const REF$_SYMBOL = Symbol("Ref$");

/**
 * Observable element ref type.
 * T carries the nullability — use `Ref$<T | null>` for nullable refs.
 *
 * - `Ref$<T>` — `current`, `get()`, `peek()` return `T` (non-null)
 * - `Ref$<T | null>` — `current`, `get()`, `peek()` return `T | null`
 */
export type Ref$<T> = ((node: T | null) => void) &
  ReadonlyObservable<T> & {
    readonly [REF$_SYMBOL]: true;
    /** returns element, registers tracking when called inside useObserve */
    get(): T;
    /** returns element without registering tracking */
    peek(): T;
    /** imperatively set element */
    set(value: T | null): void;
    /** returns element without tracking — useRef-compatible read */
    current: T;
  };

/**
 * Core (framework-agnostic) version of useRef$.
 * Creates an observable element ref with opaque wrapping.
 *
 * - non-null value → `Ref$<T>`: `current`, `get()`, `peek()` return `T`
 * - null / no arg → `Ref$<T | null>`: `current`, `get()`, `peek()` return `T | null`
 *
 * Nullability is expressed via the type parameter, mirroring `T | null` at the call site.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRef$<T = any>(initialValue: null): Ref$<T | null>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRef$<T = any>(initialValue: T): Ref$<T>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRef$<T = any>(): Ref$<T | null>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRef$<T = any>(initialValue?: T | null): Ref$<T | null> {
  const el$ = createOpaque<T>(initialValue);

  const fn = (node: T | null) => {
    el$.set(node);
  };

  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === REF$_SYMBOL) return true;
      if (prop === "get") return () => el$.get();
      if (prop === "peek") return () => el$.peek();
      if (prop === "set") return (value: T | null) => el$.set(value);
      if (prop === "current") return el$.peek();
      // Forward Function.prototype methods (bind, call, apply) to the
      // target function. React DEV mode calls ref.bind(null) inside
      // safelyDetachRef — without this, the Proxy would fall through to
      // el$ (Observable) which doesn't have .bind.
      if (prop === "bind" || prop === "call" || prop === "apply") {
        return (fn as any)[prop].bind(fn); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (el$ as any)[prop];
      return typeof val === "function" ? val.bind(el$) : val;
    },
    set(_target, p, newValue) {
      if (p === "current") {
        el$.set(newValue);
        return true;
      }
      return false;
    },
  }) as Ref$<T> & Disposable;
}

/** Type guard for Ref$ — distinguishes it from Observable and raw values */
export function isRef$(v: unknown): v is Ref$<Element | null> {
  return v != null && (v as any)[REF$_SYMBOL] === true; // eslint-disable-line @typescript-eslint/no-explicit-any
}
