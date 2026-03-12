"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useObservable } from "@legendapp/state/react";
import { useEventListener } from "@browser/useEventListener";
import { defaultNavigator, defaultWindow } from "@usels/core/shared/configurable";

export type UsePreferredLanguagesReturn = ReadonlyObservable<readonly string[]>;

/*@__NO_SIDE_EFFECTS__*/
export function usePreferredLanguages(): UsePreferredLanguagesReturn {
  const languages$ = useObservable<readonly string[]>(defaultNavigator?.languages ?? ["en"]);

  useEventListener(
    defaultWindow,
    "languagechange",
    () => {
      languages$.set(defaultNavigator?.languages ?? ["en"]);
    },
    { passive: true }
  );

  return languages$;
}
