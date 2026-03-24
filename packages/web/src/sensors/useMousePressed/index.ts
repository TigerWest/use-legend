"use client";
import { useObservable } from "@legendapp/state/react";
import { useCallback } from "react";
import { type MaybeElement } from "@usels/core";
import type { DeepMaybeObservable } from "@usels/core";
import type { ReadonlyObservable } from "@usels/core";
import { useMaybeObservable } from "@usels/core";
import { useInitialPick } from "@usels/core";
import { useConstant } from "@usels/core/shared/useConstant";
import { type ConfigurableWindow, defaultWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useEventListener } from "@browser/useEventListener";

export type UseMousePressedSourceType = "mouse" | "touch" | null;

export interface UseMousePressedOptions extends ConfigurableWindow {
  /** Track touch events. Default: true */
  touch?: boolean;
  /** Event target for press detection. Default: window */
  target?: MaybeElement;
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

export function useMousePressed(
  options?: DeepMaybeObservable<UseMousePressedOptions>
): UseMousePressedReturn {
  const opts$ = useMaybeObservable<UseMousePressedOptions>(options, {
    onPressed: "function",
    onReleased: "function",
    window: "element",
  });

  const window$ = useResolvedWindow(opts$.window);

  // mount-time-only
  const { touch } = useInitialPick(opts$, { touch: true });

  const pressed$ = useObservable(false);
  const sourceType$ = useObservable<UseMousePressedSourceType>(null);

  // Extract raw target from options at mount time (same pattern as useMouse)
  const eventTarget: MaybeElement = useConstant(() => {
    const win = (window$.peek() ?? defaultWindow ?? null) as MaybeElement;
    if (options == null) return win;
    const target = (options as Record<string, unknown>).target as MaybeElement | undefined;
    return target ?? win;
  });

  // --- Pointer events (mouse) ---

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (opts$.preventDragEvent?.peek()) e.preventDefault();
    pressed$.set(true);
    sourceType$.set("mouse");
    opts$.peek()?.onPressed?.(e);
  }, []);

  // Release always on window (even if press was on a specific element)
  const onPointerUp = useCallback((e: PointerEvent) => {
    if (!pressed$.peek()) return;
    pressed$.set(false);
    opts$.peek()?.onReleased?.(e);
  }, []);

  useEventListener(eventTarget, "pointerdown", onPointerDown);
  useEventListener(window$, "pointerup", onPointerUp);

  // --- Touch events ---
  const touchTarget: MaybeElement = touch ? eventTarget : null;

  const onTouchStart = useCallback((e: TouchEvent) => {
    pressed$.set(true);
    sourceType$.set("touch");
    opts$.peek()?.onPressed?.(e);
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (!pressed$.peek()) return;
    pressed$.set(false);
    opts$.peek()?.onReleased?.(e);
  }, []);

  useEventListener(touchTarget, "touchstart", onTouchStart, { passive: true });
  useEventListener(touch ? window$ : null, "touchend", onTouchEnd, {
    passive: true,
  });
  useEventListener(touch ? window$ : null, "touchcancel", onTouchEnd, {
    passive: true,
  });

  return { pressed$, sourceType$ };
}
