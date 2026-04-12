import { observable } from "@legendapp/state";
import type { ReadonlyObservable } from "@usels/core";
import { createMediaQuery } from "../useMediaQuery/core";

export type ReducedMotionPreference = "reduce" | "no-preference";

export type UsePreferredReducedMotionReturn = ReadonlyObservable<ReducedMotionPreference>;

/**
 * Framework-agnostic reactive `prefers-reduced-motion` tracker.
 *
 * Composes `createMediaQuery` and exposes a computed `Observable` mapping
 * to `'reduce'` / `'no-preference'`. Must be called inside a `useScope` factory.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPreferredReducedMotion(): UsePreferredReducedMotionReturn {
  const isReduced$ = createMediaQuery("(prefers-reduced-motion: reduce)");

  const motion$ = observable<ReducedMotionPreference>(() =>
    isReduced$.get() ? "reduce" : "no-preference"
  );

  return motion$ as ReadonlyObservable<ReducedMotionPreference>;
}
