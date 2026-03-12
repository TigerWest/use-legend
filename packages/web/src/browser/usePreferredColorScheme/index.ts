"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useMediaQuery } from "@browser/useMediaQuery";
import { useObservable } from "@legendapp/state/react";

export type ColorScheme = "dark" | "light" | "no-preference";

export type UsePreferredColorSchemeReturn = ReadonlyObservable<ColorScheme>;

/*@__NO_SIDE_EFFECTS__*/
export function usePreferredColorScheme(): UsePreferredColorSchemeReturn {
  const isDark$ = useMediaQuery("(prefers-color-scheme: dark)");
  const isLight$ = useMediaQuery("(prefers-color-scheme: light)");

  const scheme$ = useObservable<ColorScheme>(() => {
    if (isDark$.get()) return "dark";
    if (isLight$.get()) return "light";
    return "no-preference";
  });

  return scheme$;
}
