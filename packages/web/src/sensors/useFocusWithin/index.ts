"use client";
import type { Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { peek } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { useEventListener } from "@browser/useEventListener";

export interface UseFocusWithinReturn {
  /** Whether focus is within the container or any descendants (read-only) */
  focused$: Observable<boolean>;
}

/**
 * Tracks whether focus is within a target element or any of its descendants.
 *
 * Uses `focusin`/`focusout` events with `el.matches(':focus-within')` to
 * reliably detect focus state. This approach delegates the check to the
 * browser's CSS engine, correctly handling edge cases like iframes and
 * Shadow DOM boundaries where `relatedTarget` would be `null`.
 *
 * @param target - The container element to track focus within. Supports
 *   `MaybeEventTarget` (element, ref, Observable ref, or null).
 * @returns `focused$` — an Observable<boolean> that is true when focus is
 *   anywhere inside the container.
 */
/*@__NO_SIDE_EFFECTS__*/
export function useFocusWithin(target: MaybeEventTarget): UseFocusWithinReturn {
  const focused$ = useObservable<boolean>(false);

  useEventListener(target, "focusin", () => {
    focused$.set(true);
  });

  useEventListener(target, "focusout", () => {
    const el = peek(target) as HTMLElement | null;
    if (!el) return;
    // Delegate to the browser's CSS engine — handles iframes, Shadow DOM,
    // and other cases where relatedTarget would be null.
    focused$.set(el.matches(":focus-within"));
  });

  return { focused$ };
}
