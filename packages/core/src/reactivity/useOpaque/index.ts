"use client";
import { useConstant } from "@shared/useConstant";
import { createOpaque, type OpaqueObservable } from "./core";

export type { OpaqueObservable } from "./core";

/**
 * Creates an `OpaqueObservable<T>` — an `Observable<OpaqueObject<T | null>>` that
 * prevents Legend-State from deep-proxying the stored object.
 *
 * `.get()` / `.peek()` auto-unwrap, `.set(value)` auto-wraps with opaque — no manual
 * `ObservableHint.opaque()` or `.valueOf()` needed. `isObservable()` = true.
 *
 * @param initialValue - Initial value (optional, defaults to null)
 * @returns `OpaqueObservable<T>` — a proper Observable (isObservable = true)
 *
 * @example
 * ```tsx
 * const obj$ = useOpaque<MyObj>();
 * obj$.set(myObj);      // auto-wraps with opaque
 * obj$.get();           // auto-unwraps → MyObj | null
 * isObservable(obj$);   // true
 * ```
 */
export function useOpaque<T>(initialValue?: T | null): OpaqueObservable<T> {
  return useConstant(() => createOpaque<T>(initialValue));
}
