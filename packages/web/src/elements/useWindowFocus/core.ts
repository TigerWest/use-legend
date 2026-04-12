import { observable, type Observable } from "@legendapp/state";
import { onMount } from "@usels/core";
import { defaultDocument } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

export type UseWindowFocusReturn = Observable<boolean>;

/**
 * Framework-agnostic reactive window focus tracker.
 *
 * Exposes an `Observable<boolean>` that reflects whether the browser window
 * currently has focus. Initial value is synced from `document.hasFocus()` in
 * `onMount` to match SSR output and avoid hydration mismatch. Updates via
 * `focus` / `blur` events on `window`.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createWindowFocus(): UseWindowFocusReturn {
  // Always initialize with false to match SSR output and avoid hydration mismatch.
  // The actual value is synced after mount.
  const focused$ = observable<boolean>(false);

  onMount(() => {
    focused$.set(defaultDocument?.hasFocus() ?? false);
  });

  createEventListener("focus", () => focused$.set(true), { passive: true });
  createEventListener("blur", () => focused$.set(false), { passive: true });

  return focused$;
}
