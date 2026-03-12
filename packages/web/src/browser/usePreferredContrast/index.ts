"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useMediaQuery } from "@browser/useMediaQuery";
import { useObservable } from "@legendapp/state/react";

export type ContrastPreference = "more" | "less" | "custom" | "no-preference";

export type UsePreferredContrastReturn = ReadonlyObservable<ContrastPreference>;

/*@__NO_SIDE_EFFECTS__*/
export function usePreferredContrast(): UsePreferredContrastReturn {
  const isMore$ = useMediaQuery("(prefers-contrast: more)");
  const isLess$ = useMediaQuery("(prefers-contrast: less)");
  const isCustom$ = useMediaQuery("(prefers-contrast: custom)");

  const contrast$ = useObservable<ContrastPreference>(() => {
    if (isMore$.get()) return "more";
    if (isLess$.get()) return "less";
    if (isCustom$.get()) return "custom";
    return "no-preference";
  });

  return contrast$;
}
