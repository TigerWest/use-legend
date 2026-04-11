import { observable, type Observable } from "@legendapp/state";
import { onMount, type DeepMaybeObservable, type ReadonlyObservable } from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../useEventListener/core";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- intentional alias to allow future extension without breaking API
export interface UsePreferredLanguagesOptions extends ConfigurableWindow {}

export type UsePreferredLanguagesReturn = ReadonlyObservable<readonly string[]>;

/**
 * Framework-agnostic reactive `navigator.languages` tracker.
 *
 * Tracks the user's preferred languages and updates whenever the `languagechange`
 * event fires on the resolved window. Must be called inside a `useScope` factory.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPreferredLanguages(
  options?: DeepMaybeObservable<UsePreferredLanguagesOptions>
): UsePreferredLanguagesReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  const languages$ = observable<readonly string[]>([]);

  const readLanguages = (): readonly string[] => {
    const win = win$.peek();
    return win?.navigator?.languages ?? ["en"];
  };

  onMount(() => {
    languages$.set(readLanguages());
  });

  createEventListener(
    win$ as unknown as Observable<unknown>,
    "languagechange",
    () => {
      languages$.set(readLanguages());
    },
    { passive: true }
  );

  return languages$ as ReadonlyObservable<readonly string[]>;
}
