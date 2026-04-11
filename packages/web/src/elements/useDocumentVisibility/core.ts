import { observable, type Observable } from "@legendapp/state";
import { onMount } from "@usels/core";
import { defaultDocument } from "@shared/configurable";

/**
 * Framework-agnostic reactive document visibility state.
 *
 * Tracks the browser tab's visibility state (`'visible'` or `'hidden'`).
 * Returns a writable `Observable<DocumentVisibilityState>` that updates
 * automatically when the user switches tabs or minimizes the window.
 *
 * SSR-safe: returns `'visible'` when `document` is not available.
 *
 * @returns `Observable<DocumentVisibilityState>` — reflects current tab visibility.
 */
export function createDocumentVisibility(): Observable<DocumentVisibilityState> {
  // Always initialize with 'visible' to match SSR output and avoid hydration mismatch.
  // The actual value is synced after mount.
  const visibility$ = observable<DocumentVisibilityState>("visible");

  onMount(() => {
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
