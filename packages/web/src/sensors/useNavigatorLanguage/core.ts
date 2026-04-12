import { observable } from "@legendapp/state";
import { createSupported, onMount } from "@usels/core";
import type { DeepMaybeObservable, ReadonlyObservable, Supportable } from "@usels/core";
import { type ConfigurableWindow, defaultNavigator, defaultWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export interface UseNavigatorLanguageReturn extends Supportable {
  /** Current browser language (e.g., "en-US") */
  language$: ReadonlyObservable<string | undefined>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UseNavigatorLanguageOptions extends ConfigurableWindow {}

/*@__NO_SIDE_EFFECTS__*/
export function createNavigatorLanguage(
  _options?: DeepMaybeObservable<UseNavigatorLanguageOptions>
): UseNavigatorLanguageReturn {
  const isSupported$ = createSupported(() => !!defaultNavigator && "language" in defaultNavigator);
  const language$ = observable<string | undefined>(undefined);

  onMount(() => {
    if (defaultNavigator) {
      language$.set(defaultNavigator.language);
    }
  });

  createEventListener(
    (defaultWindow as MaybeEventTarget) ?? null,
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
