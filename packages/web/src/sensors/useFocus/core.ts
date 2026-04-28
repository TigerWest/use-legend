import { observable, type Observable } from "@legendapp/state";
import { createObserve, onMount, get, type DeepMaybeObservable } from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export interface UseFocusOptions extends ConfigurableWindow {
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
 * Framework-agnostic reactive focus tracking for a target element with
 * optional two-way binding.
 *
 * Exposes `focused$` as a read/write Observable:
 * - Setting `focused$.set(true)` calls `el.focus()`
 * - Setting `focused$.set(false)` calls `el.blur()`
 * - DOM focus/blur events update `focused$` automatically.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createFocus(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseFocusOptions>
): UseFocusReturn {
  const opts$ = observable(options);
  const focused$ = observable<boolean>(false);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  // --- Event handlers ---
  createEventListener(
    target,
    "focus",
    () => {
      const win = win$.peek();
      if (!win) return;
      const focusVisible = opts$.peek()?.focusVisible ?? false;
      if (focusVisible) {
        const el = get(target);
        if (!el || !(el instanceof Element) || !el.matches(":focus-visible")) return;
      }
      if (!focused$.peek()) {
        focused$.set(true);
      }
    },
    { passive: true }
  );

  createEventListener(
    target,
    "blur",
    () => {
      if (focused$.peek()) {
        focused$.set(false);
      }
    },
    { passive: true }
  );

  // --- Two-way binding: focused$ changes → focus/blur the element ---
  createObserve(() => {
    const isFocused = focused$.get();
    const el = get(target);
    if (!el || !(el instanceof HTMLElement)) return;

    const win = win$.get();
    if (!win) return;

    if (isFocused) {
      if (win.document.activeElement !== el) {
        el.focus({ preventScroll: opts$.peek()?.preventScroll ?? false });
      }
    } else {
      if (win.document.activeElement === el) {
        el.blur();
      }
    }
  });

  // --- Auto-focus on mount ---
  onMount(() => {
    if (opts$.peek()?.initialValue) {
      const el = get(target);
      if (el instanceof HTMLElement) {
        el.focus({ preventScroll: opts$.peek()?.preventScroll ?? false });
      }
    }
  });

  return { focused$ };
}
