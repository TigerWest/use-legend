"use client";
import type { Observable } from "@legendapp/state";
import type { Fn, MaybeObservable, ReadonlyObservable } from "../../types";
import { useScope } from "@primitives/useScope";
import { createComputedWithControl } from "./core";

export { createComputedWithControl } from "./core";

/**
 * Computed Observable with explicit source control and manual trigger.
 * Only recomputes when the declared source changes — other reactive values
 * accessed inside the getter (even via `.get()`) do not trigger recalculation.
 *
 * @param source - Reactive dependency that triggers recomputation. Accepts a plain value, Observable, or array of MaybeObservables.
 * @param fn - Getter function. Receives the current source value and previous computed value. Returns the new computed value.
 * @returns `{ value$, trigger }` — read-only computed Observable and a function to force recomputation.
 *
 * @example
 * ```tsx
 * const counter$ = observable(1);
 * const { value$ } = useComputedWithControl(counter$, (count) => count * 2);
 * // value$.get() === 2, updates when counter$ changes
 * ```
 */
// Overload: single source
export function useComputedWithControl<S, T>(
  source: Observable<S>,
  fn: (sourceValue: S, prev: T | undefined) => T
): { value$: ReadonlyObservable<T>; trigger: Fn };

/* eslint-disable @typescript-eslint/no-explicit-any -- overload + implementation signatures require any for type compatibility */
// Overload: array source
export function useComputedWithControl<T>(
  source: MaybeObservable<any>[],
  fn: (sourceValues: any[], prev: T | undefined) => T
): { value$: ReadonlyObservable<T>; trigger: Fn };

// Implementation
export function useComputedWithControl<T>(
  source: MaybeObservable<any> | MaybeObservable<any>[],
  fn: (sourceValue: any, prev: T | undefined) => T
): { value$: ReadonlyObservable<T>; trigger: Fn } {
  return useScope(
    (p) => {
      // p.fn gives the latest fn (replaces useLatest pattern)

      const fnWrapper = (sourceValue: any, prev: T | undefined) =>
        (p.fn as typeof fn)(sourceValue, prev);
      const { value$, trigger } = createComputedWithControl(source as any, fnWrapper);
      return { value$: value$ as unknown as ReadonlyObservable<T>, trigger };
    },
    { fn } as Record<string, unknown>
  );
}
