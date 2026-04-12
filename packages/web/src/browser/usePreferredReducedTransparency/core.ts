import { observable } from "@legendapp/state";
import type { ReadonlyObservable } from "@usels/core";
import { createMediaQuery } from "../useMediaQuery/core";

export type ReducedTransparencyPreference = "reduce" | "no-preference";

export type UsePreferredReducedTransparencyReturn =
  ReadonlyObservable<ReducedTransparencyPreference>;

/**
 * Framework-agnostic reactive `prefers-reduced-transparency` tracker.
 *
 * Composes `createMediaQuery` and exposes a computed `Observable` mapping
 * to `'reduce'` / `'no-preference'`. Must be called inside a `useScope` factory.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPreferredReducedTransparency(): UsePreferredReducedTransparencyReturn {
  const isReduced$ = createMediaQuery("(prefers-reduced-transparency: reduce)");

  const transparency$ = observable<ReducedTransparencyPreference>(() =>
    isReduced$.get() ? "reduce" : "no-preference"
  );

  return transparency$ as ReadonlyObservable<ReducedTransparencyPreference>;
}
