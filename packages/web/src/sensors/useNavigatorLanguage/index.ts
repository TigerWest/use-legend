"use client";
import type { ReadonlyObservable, Supportable } from "@usels/core";
import { useSupported, useMaybeObservable } from "@usels/core";
import { useObservable, useMount } from "@legendapp/state/react";
import {
  type ConfigurableNavigator,
  type ConfigurableWindow,
  defaultNavigator,
} from "@shared/configurable";
import { useEventListener } from "@browser/useEventListener";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

export interface UseNavigatorLanguageReturn extends Supportable {
  /** Current browser language (e.g., "en-US") */
  language$: ReadonlyObservable<string | undefined>;
}

export interface UseNavigatorLanguageOptions extends ConfigurableNavigator, ConfigurableWindow {}

/*@__NO_SIDE_EFFECTS__*/
export function useNavigatorLanguage(
  options?: UseNavigatorLanguageOptions
): UseNavigatorLanguageReturn {
  const opts$ = useMaybeObservable<UseNavigatorLanguageOptions>(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);
  const nav = options?.navigator ?? defaultNavigator;

  const isSupported$ = useSupported(() => !!defaultNavigator && "language" in defaultNavigator);

  const language$ = useObservable<string | undefined>();

  useMount(() => {
    if (nav) {
      language$.set(nav.language);
    }
  });

  useEventListener(
    window$,
    "languagechange",
    () => {
      if (nav) {
        language$.set(nav.language);
      }
    },
    { passive: true }
  );

  return { isSupported$, language$ };
}
