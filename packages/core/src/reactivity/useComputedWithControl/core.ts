import { isObservable, observable, type Observable } from "@legendapp/state";
import type { Fn, MaybeObservable } from "../../types";
import { peek } from "@utilities/peek";
import { onUnmount } from "@primitives/useScope";

/**
 * Core observable function for computed-with-control.
 * Creates a computed observable that only recomputes when declared sources change.
 * Other reactive values accessed inside `fn` do not trigger recalculation.
 *
 * @param source$ - Single Observable or array of MaybeObservables that trigger recomputation.
 * @param fn - Getter function receiving current source value(s) and previous computed value.
 * @returns Disposable with computed Observable and a manual trigger function.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- overload + implementation signatures require any for type compatibility */

// Overload: single source
export function createComputedWithControl<S, T>(
  source$: Observable<S>,
  fn: (sourceValue: S, prev: T | undefined) => T
): { value$: Observable<T>; trigger: Fn };

// Overload: array source
export function createComputedWithControl<T>(
  source$: MaybeObservable<any>[],
  fn: (sourceValues: any[], prev: T | undefined) => T
): { value$: Observable<T>; trigger: Fn };

// Implementation
export function createComputedWithControl<T>(
  source$: MaybeObservable<any> | MaybeObservable<any>[],
  fn: (sourceValue: any, prev: T | undefined) => T
): { value$: Observable<T>; trigger: Fn } {
  const readSource = () => (Array.isArray(source$) ? source$.map((s) => peek(s)) : peek(source$));

  const value$ = observable<any>(fn(readSource(), undefined));

  const sources = Array.isArray(source$) ? source$ : [source$];
  const disposers = sources
    .filter((s) => isObservable(s))
    .map((s) =>
      (s as Observable<any>).onChange(() => {
        value$.set(fn(readSource(), value$.peek()));
      })
    );

  const trigger = () => {
    value$.set(fn(readSource(), value$.peek()));
  };

  onUnmount(() => disposers.forEach((d) => d()));

  return {
    value$: value$ as unknown as Observable<T>,
    trigger,
  };
}
