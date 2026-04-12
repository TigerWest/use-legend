import { observable, type Observable } from "@legendapp/state";
import { get } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export interface UseFocusWithinReturn {
  /** Whether focus is within the container or any descendants (read-only) */
  focused$: Observable<boolean>;
}

/**
 * Framework-agnostic tracker for whether focus is within a target element or
 * any of its descendants.
 *
 * Uses `focusin`/`focusout` events with `el.matches(':focus-within')` to
 * reliably detect focus state. This approach delegates the check to the
 * browser's CSS engine, correctly handling edge cases like iframes and
 * Shadow DOM boundaries where `relatedTarget` would be `null`.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createFocusWithin(target: MaybeEventTarget): UseFocusWithinReturn {
  const focused$ = observable<boolean>(false);

  createEventListener(target, "focusin", () => {
    focused$.set(true);
  });

  createEventListener(target, "focusout", () => {
    const el = get(target) as HTMLElement | null;
    if (!el) return;
    focused$.set(el.matches(":focus-within"));
  });

  return { focused$ };
}
