"use client";
import { isObservable } from "@legendapp/state";
import type { Observable } from "@legendapp/state";
import { useMount, useObservable } from "@legendapp/state/react";
import type { Fn, MaybeObservable, ReadonlyObservable } from "../../types";
import { peek } from "@utilities/peek";
import { useLatest } from "@shared/useLatest";
import { useConstant } from "@shared/useConstant";
import { toArray } from "@shared/utils";

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
  source: MaybeObservable<S>,
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
  const fnRef = useLatest(fn);

  const readSource = () => (Array.isArray(source) ? source.map((s) => peek(s)) : peek(source));
  const initialValue = useConstant(() => fn(readSource(), undefined));

  const value$ = useObservable<any>(initialValue);

  // Subscribe to source changes via onChange — fn runs OUTSIDE tracking context,
  // so .get() calls inside fn do NOT register as reactive dependencies.
  useMount(() => {
    const sources = toArray(source);
    const disposers = sources
      .filter((s) => isObservable(s))
      .map((s) =>
        (s as Observable<any>).onChange(() => {
          value$.set(fnRef.current(readSource(), value$.peek()));
        })
      );

    return () => disposers.forEach((d) => d());
  });

  const trigger = () => {
    value$.set(fnRef.current(readSource(), value$.peek()));
  };

  return { value$: value$ as unknown as ReadonlyObservable<T>, trigger };
}
