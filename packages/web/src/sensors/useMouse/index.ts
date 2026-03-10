"use client";
import { useObservable } from "@legendapp/state/react";
import type { MaybeElement } from "@usels/core";
import type { DeepMaybeObservable } from "@usels/core";
import type { ReadonlyObservable } from "@usels/core";
import type { ConfigurableEventFilter } from "@usels/core";
import { useMaybeObservable } from "@usels/core";
import { useInitialPick } from "@usels/core";
import { createFilterWrapper } from "@usels/core";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultWindow } from "@usels/core/shared/configurable";
import { useEventListener } from "@browser/useEventListener";

export type UseMouseCoordType = "page" | "client" | "screen" | "movement";

export type UseMouseSourceType = "mouse" | "touch" | null;

export interface UseMouseOptions extends ConfigurableEventFilter {
  /** Coordinate type. Default: "page" */
  type?: UseMouseCoordType;
  /** Track touch events. Default: true */
  touch?: boolean;
  /** Reset coordinates on touchend. Default: false */
  resetOnTouchEnds?: boolean;
  /** Event target. Default: window */
  target?: MaybeElement;
  /** Initial coordinate values. Default: { x: 0, y: 0 } */
  initialValue?: { x: number; y: number };
}

export interface UseMouseReturn {
  /** X coordinate */
  x$: ReadonlyObservable<number>;
  /** Y coordinate */
  y$: ReadonlyObservable<number>;
  /** Event source type: "mouse" | "touch" | null */
  sourceType$: ReadonlyObservable<UseMouseSourceType>;
}

export function useMouse(options?: DeepMaybeObservable<UseMouseOptions>): UseMouseReturn {
  const opts$ = useMaybeObservable<UseMouseOptions>(options);

  // mount-time-only
  const { type, touch, resetOnTouchEnds } = useInitialPick(opts$, {
    type: "page" as UseMouseCoordType,
    touch: true,
    resetOnTouchEnds: false,
  });
  const initial = opts$.initialValue?.peek() ?? { x: 0, y: 0 };

  const x$ = useObservable(initial.x);
  const y$ = useObservable(initial.y);
  const sourceType$ = useObservable<UseMouseSourceType>(null);

  // Coordinate extraction helper
  const extractCoords = (e: MouseEvent | Touch): { x: number; y: number } => {
    switch (type) {
      case "page":
        return { x: e.pageX, y: e.pageY };
      case "client":
        return { x: e.clientX, y: e.clientY };
      case "screen":
        return { x: e.screenX, y: e.screenY };
      case "movement":
      default:
        return "movementX" in e
          ? { x: (e as MouseEvent).movementX, y: (e as MouseEvent).movementY }
          : { x: 0, y: 0 };
    }
  };

  // Extract raw target and eventFilter from options at mount time.
  // Ref$ and Observable<OpaqueObject<Element>> are themselves reactive —
  // useEventListener handles them internally via its useObserve.
  // No 'element' hint needed; avoids lazy computed activation issues.
  const eventTarget: MaybeElement = useConstant(() => {
    if (options == null) return defaultWindow ?? null;
    const target = (options as Record<string, unknown>).target as MaybeElement | undefined;
    return target ?? defaultWindow ?? null;
  });

  // Extract eventFilter from options at mount time.
  const eventFilter = useConstant(() => {
    if (options == null) return undefined;
    return (options as Record<string, unknown>).eventFilter as
      | UseMouseOptions["eventFilter"]
      | undefined;
  });

  // mousemove — wrapped with createFilterWrapper if eventFilter is provided
  const onMouseMove = useConstant(() => {
    const raw = (e: MouseEvent) => {
      const { x, y } = extractCoords(e);
      x$.set(x);
      y$.set(y);
      sourceType$.set("mouse");
    };
    if (!eventFilter) return raw;
    return createFilterWrapper(eventFilter, raw);
  });

  useEventListener(eventTarget, "mousemove", onMouseMove, { passive: true });

  // touch events (conditional — always call hooks, null target to disable)
  const touchTarget: MaybeElement = touch ? eventTarget : null;

  const onTouchMove = useConstant(() => {
    const raw = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      const { x, y } = extractCoords(t);
      x$.set(x);
      y$.set(y);
      sourceType$.set("touch");
    };
    if (!eventFilter) return raw;
    return createFilterWrapper(eventFilter, raw);
  });

  // touchend is a reset action — not filtered
  const onTouchEnd = useConstant(() => () => {
    if (resetOnTouchEnds) {
      x$.set(initial.x);
      y$.set(initial.y);
    }
  });

  useEventListener(touchTarget, "touchstart", onTouchMove, { passive: true });
  useEventListener(touchTarget, "touchmove", onTouchMove, { passive: true });
  useEventListener(touchTarget, "touchend", onTouchEnd, { passive: true });

  return { x$, y$, sourceType$ };
}
