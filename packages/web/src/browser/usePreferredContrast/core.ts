import { observable } from "@legendapp/state";
import type { ReadonlyObservable } from "@usels/core";
import { createMediaQuery } from "../useMediaQuery/core";

export type ContrastPreference = "more" | "less" | "custom" | "no-preference";

export type UsePreferredContrastReturn = ReadonlyObservable<ContrastPreference>;

/**
 * Framework-agnostic reactive `prefers-contrast` tracker.
 *
 * Composes three `createMediaQuery` calls (`more`, `less`, `custom`) and
 * exposes a computed `Observable` mapping them to the matching preference
 * name, or `'no-preference'`. Must be called inside a `useScope` factory.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPreferredContrast(): UsePreferredContrastReturn {
  const isMore$ = createMediaQuery("(prefers-contrast: more)");
  const isLess$ = createMediaQuery("(prefers-contrast: less)");
  const isCustom$ = createMediaQuery("(prefers-contrast: custom)");

  const contrast$ = observable<ContrastPreference>(() => {
    if (isMore$.get()) return "more";
    if (isLess$.get()) return "less";
    if (isCustom$.get()) return "custom";
    return "no-preference";
  });

  return contrast$ as ReadonlyObservable<ContrastPreference>;
}
