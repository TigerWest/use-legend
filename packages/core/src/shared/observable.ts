import { observable as _legendObservable, type Observable } from "@legendapp/state";
import type { DeepMaybeObservable, WidenPrimitive } from "../types";

/**
 * Re-export of Legend-State's `observable()` with additional overloads for `DeepMaybeObservable<T>`.
 *
 * Legend-State's catch-all `observable<T>(value: T): Observable<T>` infers
 * `T = DeepMaybeObservable<Options>` when passed a `DeepMaybeObservable<Options>`,
 * returning `Observable<DeepMaybeObservable<Options>>` instead of `Observable<Options>`.
 *
 * These overloads fix that while preserving the original behavior for:
 * - Computed observables: `observable(() => value)` → `Observable<ReturnType>`
 * - Plain primitives:     `observable(0)`           → `Observable<number>` (not `Observable<0>`)
 * - Options objects:      `observable(opts)`        → `Observable<T>`
 *
 * Usage: import `observable` from `@shared/observable` instead of `@legendapp/state`
 * in files that accept `DeepMaybeObservable<T>` options.
 */
export const observable = _legendObservable as unknown as {
  <T>(): Observable<T | undefined>;
  <T>(value: () => T): Observable<T>;
  <T extends object>(value: DeepMaybeObservable<T>): Observable<T>;
  <T extends object>(value?: DeepMaybeObservable<T>): Observable<T | undefined>;
  <T>(value: T): Observable<WidenPrimitive<T>>;
};
