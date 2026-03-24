"use client";
import type { Observable } from "@legendapp/state";
import { useObservable, useMount } from "@legendapp/state/react";
import { type ConfigurableDocument, defaultDocument } from "@shared/configurable";

export type UseDocumentVisibilityOptions = ConfigurableDocument;

/*@__NO_SIDE_EFFECTS__*/
export function useDocumentVisibility(
  options?: UseDocumentVisibilityOptions
): Observable<DocumentVisibilityState> {
  const doc = options?.document ?? defaultDocument;

  // Always initialize with 'visible' to match SSR output and avoid hydration mismatch.
  // The actual value is synced after mount.
  const visibility$ = useObservable<DocumentVisibilityState>("visible");

  useMount(() => {
    if (!doc) return;

    visibility$.set(doc.visibilityState);

    const handler = () => {
      visibility$.set(doc.visibilityState);
    };

    doc.addEventListener("visibilitychange", handler, { passive: true });

    return () => {
      doc.removeEventListener("visibilitychange", handler);
    };
  });

  return visibility$;
}
