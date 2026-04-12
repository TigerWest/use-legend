import { observable } from "@legendapp/state";
import { type DeepMaybeObservable, type ReadonlyObservable, peek } from "@usels/core";
import type { ConfigurableEventFilter } from "@usels/core";
import { createFilterWrapper } from "@usels/core/shared/filters";
import { defaultWindow, type ConfigurableWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export type UseMouseCoordType = "page" | "client" | "screen" | "movement";

export type UseMouseSourceType = "mouse" | "touch" | null;

export interface UseMouseOptions extends ConfigurableEventFilter, ConfigurableWindow {
  /** Coordinate type. Default: "page" */
  type?: UseMouseCoordType;
  /** Track touch events. Default: true */
  touch?: boolean;
  /** Reset coordinates on touchend. Default: false */
  resetOnTouchEnds?: boolean;
  /** Event target. Default: window */
  target?: MaybeEventTarget;
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

/**
 * Framework-agnostic mouse/touch position tracker.
 *
 * Monitors `mousemove` and optionally `touchstart`/`touchmove`/`touchend`
 * events on a target (default: window) and exposes reactive coordinates.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createMouse(options?: DeepMaybeObservable<UseMouseOptions>): UseMouseReturn {
  // All options are mount-time-only — read once via peek(), no observable()
  // wrapping needed. Avoiding observable() prevents Legend-State from linking
  // the Ref$ target into its reactive tree, which would break React ref cleanup.
  const raw = peek(options) as UseMouseOptions | undefined;

  const type = raw?.type ?? "page";
  const touch = raw?.touch ?? true;
  const resetOnTouchEnds = raw?.resetOnTouchEnds ?? false;
  const initial = raw?.initialValue ?? { x: 0, y: 0 };
  const eventFilter = raw?.eventFilter as UseMouseOptions["eventFilter"] | undefined;

  // Resolve event target — read from raw options to preserve Ref$/Observable
  // reference identity. createEventListener tracks it reactively via normalizeTargets.
  const rawTarget = raw?.target as MaybeEventTarget | undefined;
  const eventTarget: MaybeEventTarget = rawTarget ?? (defaultWindow as MaybeEventTarget) ?? null;

  const x$ = observable(initial.x);
  const y$ = observable(initial.y);
  const sourceType$ = observable<UseMouseSourceType>(null);

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

  // mousemove — wrapped with createFilterWrapper if eventFilter is provided
  const onMouseMove = (() => {
    const raw = (e: MouseEvent) => {
      const { x, y } = extractCoords(e);
      x$.set(x);
      y$.set(y);
      sourceType$.set("mouse");
    };
    if (!eventFilter) return raw;
    return createFilterWrapper(eventFilter, raw);
  })();

  createEventListener(eventTarget, "mousemove", onMouseMove, { passive: true });

  // touch events (conditional — null target to disable)
  const touchTarget: MaybeEventTarget = touch ? eventTarget : null;

  const onTouchMove = (() => {
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
  })();

  // touchend is a reset action — not filtered
  const onTouchEnd = () => {
    if (resetOnTouchEnds) {
      x$.set(initial.x);
      y$.set(initial.y);
    }
  };

  createEventListener(touchTarget, "touchstart", onTouchMove, { passive: true });
  createEventListener(touchTarget, "touchmove", onTouchMove, { passive: true });
  createEventListener(touchTarget, "touchend", onTouchEnd, { passive: true });

  return { x$, y$, sourceType$ };
}
