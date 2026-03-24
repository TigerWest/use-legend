"use client";
import type { Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useMount } from "@legendapp/state/react";
import { useEventListener } from "@browser/useEventListener";
import { type ConfigurableDocument, defaultDocument } from "@shared/configurable";

export type UseWindowFocusOptions = ConfigurableDocument;

/*@__NO_SIDE_EFFECTS__*/
export function useWindowFocus(options?: UseWindowFocusOptions): Observable<boolean> {
  const doc = options?.document ?? defaultDocument;

  // Always initialize with false to match SSR output and avoid hydration mismatch.
  // The actual value is synced after mount.
  const focused$ = useObservable<boolean>(false);

  useMount(() => {
    focused$.set(doc?.hasFocus() ?? false);
  });

  useEventListener("focus", () => focused$.set(true), { passive: true });
  useEventListener("blur", () => focused$.set(false), { passive: true });

  return focused$;
}
