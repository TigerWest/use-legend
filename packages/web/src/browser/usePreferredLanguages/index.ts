"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { useEventListener } from "@browser/useEventListener";
import { defaultNavigator, defaultWindow } from "@shared/configurable";

export type UsePreferredLanguagesReturn = ReadonlyObservable<readonly string[]>;

/*@__NO_SIDE_EFFECTS__*/
export function usePreferredLanguages(): UsePreferredLanguagesReturn {
  const languages$ = useObservable<readonly string[]>([]);

  useMount(() => {
    languages$.set(defaultNavigator?.languages ?? ["en"]);
  });

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
