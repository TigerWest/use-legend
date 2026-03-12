"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useMediaQuery } from "@browser/useMediaQuery";
import { useObservable } from "@legendapp/state/react";

export type ReducedMotionPreference = "reduce" | "no-preference";

export type UsePreferredReducedMotionReturn = ReadonlyObservable<ReducedMotionPreference>;

/*@__NO_SIDE_EFFECTS__*/
export function usePreferredReducedMotion(): UsePreferredReducedMotionReturn {
  const isReduced$ = useMediaQuery("(prefers-reduced-motion: reduce)");

  const motion$ = useObservable<ReducedMotionPreference>(() =>
    isReduced$.get() ? "reduce" : "no-preference"
  );

  return motion$;
}
