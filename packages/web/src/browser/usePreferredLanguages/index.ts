"use client";
import type { ReadonlyObservable } from "@usels/core";
import { useMaybeObservable } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { useEventListener } from "@browser/useEventListener";
import { type ConfigurableWindow, defaultNavigator } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UsePreferredLanguagesOptions extends ConfigurableWindow {}

export type UsePreferredLanguagesReturn = ReadonlyObservable<readonly string[]>;

/*@__NO_SIDE_EFFECTS__*/
export function usePreferredLanguages(
  options?: UsePreferredLanguagesOptions
): UsePreferredLanguagesReturn {
  const opts$ = useMaybeObservable<UsePreferredLanguagesOptions>(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);
  const languages$ = useObservable<readonly string[]>([]);

  useMount(() => {
    languages$.set(defaultNavigator?.languages ?? ["en"]);
  });

  useEventListener(
    window$,
    "languagechange",
    () => {
      languages$.set(defaultNavigator?.languages ?? ["en"]);
    },
    { passive: true }
  );

  return languages$;
}
