"use client";
import type { Observable } from "@legendapp/state";
import { useObservable, useObserve, useMount } from "@legendapp/state/react";
import { useCallback } from "react";
import {
  useMaybeObservable,
  peekElement,
  type DeepMaybeObservable,
  type MaybeElement,
} from "@usels/core";
import { useEventListener } from "@browser/useEventListener";
import { defaultWindow } from "@shared/configurable";

export interface UseFocusOptions {
  /** Auto-focus the element on mount. Default: false */
  initialValue?: boolean;
  /** Replicate :focus-visible behavior. Default: false */
  focusVisible?: boolean;
  /** Prevent scroll when focusing. Default: false */
  preventScroll?: boolean;
}

export interface UseFocusReturn {
  /** Current focus state (read/write) — set(true)→focus(), set(false)→blur() */
  focused$: Observable<boolean>;
}

/**
 * Reactive focus tracking for a target element with optional two-way binding.
 *
 * @param target - The element to track focus on
 * @param options - Configuration options
 * @returns An object containing `focused$` observable (read/write)
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLInputElement>(null);
 * const { focused$ } = useFocus(ref);
 * // programmatically focus:
 * focused$.set(true);
 * ```
 */
/*@__NO_SIDE_EFFECTS__*/
export function useFocus(
  target: MaybeElement,
  options?: DeepMaybeObservable<UseFocusOptions>
): UseFocusReturn {
  const opts$ = useMaybeObservable<UseFocusOptions>(options);

  const focused$ = useObservable<boolean>(false);

  // --- Event handlers ---

  const onFocus = useCallback(() => {
    if (!defaultWindow) return;
    const focusVisible = opts$.peek()?.focusVisible ?? false;
    if (focusVisible) {
      // Only set focused if the element matches :focus-visible
      const el = peekElement(target);
      if (!el || !(el instanceof Element) || !el.matches(":focus-visible")) return;
    }
    // Avoid redundant set
    if (!focused$.peek()) {
      focused$.set(true);
    }
  }, []);

  const onBlur = useCallback(() => {
    if (focused$.peek()) {
      focused$.set(false);
    }
  }, []);

  useEventListener(target, "focus", onFocus, { passive: true });
  useEventListener(target, "blur", onBlur, { passive: true });

  // --- Two-way binding: focused$ changes → focus/blur the element ---
  useObserve(() => {
    const isFocused = focused$.get();
    const el = peekElement(target);
    if (!el || !(el instanceof HTMLElement)) return;

    if (isFocused) {
      // Only call focus if the element is not already the active element
      if (defaultWindow && defaultWindow.document.activeElement !== el) {
        el.focus({ preventScroll: opts$.peek()?.preventScroll ?? false });
      }
    } else {
      // Only call blur if the element is currently the active element
      if (defaultWindow && defaultWindow.document.activeElement === el) {
        el.blur();
      }
    }
  });

  // --- Auto-focus on mount ---
  useMount(() => {
    if (opts$.peek()?.initialValue) {
      const el = peekElement(target);
      if (el instanceof HTMLElement) {
        el.focus({ preventScroll: opts$.peek()?.preventScroll ?? false });
      }
    }
  });

  return { focused$ };
}
