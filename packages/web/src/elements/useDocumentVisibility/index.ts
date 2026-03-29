"use client";
import type { Observable } from "@legendapp/state";
import { useObservable, useMount } from "@legendapp/state/react";
import { defaultDocument } from "@shared/configurable";

/*@__NO_SIDE_EFFECTS__*/
export function useDocumentVisibility(): Observable<DocumentVisibilityState> {
  // Always initialize with 'visible' to match SSR output and avoid hydration mismatch.
  // The actual value is synced after mount.
  const visibility$ = useObservable<DocumentVisibilityState>("visible");

  useMount(() => {
    if (!defaultDocument) return;

    visibility$.set(defaultDocument.visibilityState);

    const handler = () => {
      visibility$.set(defaultDocument!.visibilityState);
    };

    defaultDocument.addEventListener("visibilitychange", handler, { passive: true });

    return () => {
      defaultDocument!.removeEventListener("visibilitychange", handler);
    };
  });

  return visibility$;
}
