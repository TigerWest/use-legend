"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useMediaQuery } from "@browser/useMediaQuery";
import { useObservable } from "@legendapp/state/react";

export type ReducedTransparencyPreference = "reduce" | "no-preference";

export type UsePreferredReducedTransparencyReturn =
  ReadonlyObservable<ReducedTransparencyPreference>;

/*@__NO_SIDE_EFFECTS__*/
export function usePreferredReducedTransparency(): UsePreferredReducedTransparencyReturn {
  const isReduced$ = useMediaQuery("(prefers-reduced-transparency: reduce)");

  const transparency$ = useObservable<ReducedTransparencyPreference>(() =>
    isReduced$.get() ? "reduce" : "no-preference"
  );

  return transparency$;
}
