import { observable } from "@legendapp/state";
import type { ReadonlyObservable } from "@usels/core";
import { createMediaQuery } from "../useMediaQuery/core";

export type ColorScheme = "dark" | "light" | "no-preference";

export type UsePreferredColorSchemeReturn = ReadonlyObservable<ColorScheme>;

/**
 * Framework-agnostic reactive `prefers-color-scheme` tracker.
 *
 * Composes two `createMediaQuery` calls (`dark` and `light`) and exposes
 * a computed `Observable` mapping them to `'dark'` / `'light'` /
 * `'no-preference'`. Must be called inside a `useScope` factory.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPreferredColorScheme(): UsePreferredColorSchemeReturn {
  const isDark$ = createMediaQuery("(prefers-color-scheme: dark)");
  const isLight$ = createMediaQuery("(prefers-color-scheme: light)");

  const scheme$ = observable<ColorScheme>(() => {
    if (isDark$.get()) return "dark";
    if (isLight$.get()) return "light";
    return "no-preference";
  });

  return scheme$ as ReadonlyObservable<ColorScheme>;
}
