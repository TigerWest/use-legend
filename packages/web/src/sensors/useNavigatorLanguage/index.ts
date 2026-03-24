"use client";
import type { ReadonlyObservable, Supportable } from "@usels/core";
import { useSupported } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import { defaultNavigator, defaultWindow } from "@usels/core/shared/configurable";
import { useEventListener } from "@browser/useEventListener";

export interface UseNavigatorLanguageReturn extends Supportable {
  /** Current browser language (e.g., "en-US") */
  language$: ReadonlyObservable<string | undefined>;
}

/*@__NO_SIDE_EFFECTS__*/
export function useNavigatorLanguage(): UseNavigatorLanguageReturn {
  const isSupported$ = useSupported(() => !!defaultNavigator && "language" in defaultNavigator);

  const language$ = useObservable<string | undefined>();

  useMount(() => {
    if (defaultNavigator) {
      language$.set(defaultNavigator.language);
    }
  });

  useEventListener(
    defaultWindow,
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
