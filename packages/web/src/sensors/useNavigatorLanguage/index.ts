"use client";
import type { ReadonlyObservable, Supportable } from "@usels/core";
import { useSupported, useMaybeObservable } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { type ConfigurableWindow, defaultNavigator } from "@shared/configurable";
import { useEventListener } from "@browser/useEventListener";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

export interface UseNavigatorLanguageReturn extends Supportable {
  /** Current browser language (e.g., "en-US") */
  language$: ReadonlyObservable<string | undefined>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseNavigatorLanguageOptions extends ConfigurableWindow {}

/*@__NO_SIDE_EFFECTS__*/
export function useNavigatorLanguage(
  options?: UseNavigatorLanguageOptions
): UseNavigatorLanguageReturn {
  const opts$ = useMaybeObservable<UseNavigatorLanguageOptions>(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);
  const isSupported$ = useSupported(() => !!defaultNavigator && "language" in defaultNavigator);

  const language$ = useObservable<string | undefined>();

  useMount(() => {
    if (defaultNavigator) {
      language$.set(defaultNavigator.language);
    }
  });

  useEventListener(
    window$,
    "languagechange",
    () => {
      if (defaultNavigator) {
        language$.set(defaultNavigator.language);
      }
    },
    { passive: true }
  );

  return { isSupported$, language$ };
}
