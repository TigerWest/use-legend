import { observable } from "@legendapp/state";
import type { DeepMaybeObservable, ReadonlyObservable } from "@usels/core";
import { peek } from "@usels/core";
import { type ConfigurableWindow, defaultWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export type UseMousePressedSourceType = "mouse" | "touch" | null;

export interface UseMousePressedOptions extends ConfigurableWindow {
  /** Track touch events. Default: true */
  touch?: boolean;
  /** Event target for press detection. Default: window */
  target?: MaybeEventTarget;
  /** Prevent drag — calls preventDefault on pointerdown. Default: false */
  preventDragEvent?: boolean;
  /** Callback fired on press */
  onPressed?: (e: PointerEvent | TouchEvent) => void;
  /** Callback fired on release */
  onReleased?: (e: PointerEvent | TouchEvent) => void;
}

export interface UseMousePressedReturn {
  /** Current pressed state */
  pressed$: ReadonlyObservable<boolean>;
  /** Event source type: "mouse" | "touch" | null */
  sourceType$: ReadonlyObservable<UseMousePressedSourceType>;
}

/**
 * Framework-agnostic mouse/touch press state tracker.
 *
 * Monitors `pointerdown`/`pointerup` and optionally `touchstart`/`touchend`/`touchcancel`
 * events on a target (default: window) and exposes reactive pressed state.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createMousePressed(
  options?: DeepMaybeObservable<UseMousePressedOptions>
): UseMousePressedReturn {
  // Wrap options in observable so event handlers can peek latest callbacks
  const opts$ = observable(options);
  const raw = peek(options) as UseMousePressedOptions | undefined;

  const touch = raw?.touch ?? true;

  // Resolve event target — read from raw options to preserve Ref$/Observable
  // reference identity. createEventListener tracks it reactively via normalizeTargets.
  const rawTarget = (options as UseMousePressedOptions | undefined)?.target as
    | MaybeEventTarget
    | undefined;
  const win: MaybeEventTarget = (defaultWindow ?? null) as MaybeEventTarget;
  const eventTarget: MaybeEventTarget = rawTarget ?? win;

  const pressed$ = observable(false);
  const sourceType$ = observable<UseMousePressedSourceType>(null);

  // --- Pointer events (mouse) ---

  const onPointerDown = (e: PointerEvent) => {
    if (opts$.peek()?.preventDragEvent) e.preventDefault();
    pressed$.set(true);
    sourceType$.set("mouse");
    opts$.peek()?.onPressed?.(e);
  };

  // Release always on window (even if press was on a specific element)
  const onPointerUp = (e: PointerEvent) => {
    if (!pressed$.peek()) return;
    pressed$.set(false);
    opts$.peek()?.onReleased?.(e);
  };

  createEventListener(eventTarget, "pointerdown", onPointerDown);
  createEventListener(win, "pointerup", onPointerUp);

  // --- Touch events ---
  const touchTarget: MaybeEventTarget = touch ? eventTarget : null;

  const onTouchStart = (e: TouchEvent) => {
    pressed$.set(true);
    sourceType$.set("touch");
    opts$.peek()?.onPressed?.(e);
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!pressed$.peek()) return;
    pressed$.set(false);
    opts$.peek()?.onReleased?.(e);
  };

  createEventListener(touchTarget, "touchstart", onTouchStart, { passive: true });
  createEventListener(touch ? win : null, "touchend", onTouchEnd, { passive: true });
  createEventListener(touch ? win : null, "touchcancel", onTouchEnd, { passive: true });

  return { pressed$, sourceType$ };
}
