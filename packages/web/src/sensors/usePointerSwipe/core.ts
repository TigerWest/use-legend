import { batch, observable } from "@legendapp/state";
import {
  type DeepMaybeObservable,
  type ReadonlyObservable,
  get,
  createObserve,
  onUnmount,
} from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export type UseSwipeDirection = "up" | "down" | "left" | "right" | "none";
export type PointerType = "mouse" | "touch" | "pen";

export interface UsePointerSwipeOptions {
  /** Minimum distance in px to trigger swipe. Default: 50 */
  threshold?: number;
  /** Callback on swipe start */
  onSwipeStart?: (e: PointerEvent) => void;
  /** Callback on swipe move */
  onSwipe?: (e: PointerEvent) => void;
  /** Callback on swipe end */
  onSwipeEnd?: (e: PointerEvent, direction: UseSwipeDirection) => void;
  /** Pointer types to listen to. Default: ['mouse', 'touch', 'pen'] */
  pointerTypes?: PointerType[];
  /** Disable text selection during swipe. Default: false */
  disableTextSelect?: boolean;
}

export interface UsePointerSwipeReturn {
  /** Whether swiping is in progress */
  isSwiping$: ReadonlyObservable<boolean>;
  /** Swipe direction */
  direction$: ReadonlyObservable<UseSwipeDirection>;
  /** Distance swiped on X axis */
  distanceX$: ReadonlyObservable<number>;
  /** Distance swiped on Y axis */
  distanceY$: ReadonlyObservable<number>;
  /** Start position */
  posStart$: ReadonlyObservable<{ x: number; y: number }>;
  /** End position */
  posEnd$: ReadonlyObservable<{ x: number; y: number }>;
  /** Stop listening */
  stop: () => void;
}

/**
 * Framework-agnostic reactive pointer-swipe detector.
 *
 * Listens to `pointerdown` / `pointermove` / `pointerup` on the target and
 * tracks swipe direction, distance, and start/end positions. `options` fields
 * are read reactively via `opts$`, so threshold / pointerTypes / callbacks
 * may be swapped at runtime.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPointerSwipe(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UsePointerSwipeOptions>
): UsePointerSwipeReturn {
  const opts$ = observable(options);

  const isSwiping$ = observable(false);
  const direction$ = observable<UseSwipeDirection>("none");
  const distanceX$ = observable(0);
  const distanceY$ = observable(0);
  const posStart$ = observable({ x: 0, y: 0 });
  const posEnd$ = observable({ x: 0, y: 0 });

  const state = {
    isPointerDown: false,
    isSwiping: false,
  };

  const eventIsAllowed = (e: PointerEvent): boolean => {
    const types = opts$.peek()?.pointerTypes;
    if (types) return types.includes(e.pointerType as PointerType);
    return true;
  };

  const computeDirection = (dx: number, dy: number): UseSwipeDirection => {
    const t = opts$.peek()?.threshold ?? 50;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < t) return "none";
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "left" : "right";
    }
    return dy > 0 ? "up" : "down";
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!eventIsAllowed(e)) return;
    state.isPointerDown = true;
    const eventTarget = e.target as HTMLElement | undefined;
    if (eventTarget && typeof eventTarget.setPointerCapture === "function") {
      try {
        eventTarget.setPointerCapture(e.pointerId);
      } catch {
        // setPointerCapture may throw if the pointer is no longer active
      }
    }
    batch(() => {
      posStart$.set({ x: e.clientX, y: e.clientY });
      posEnd$.set({ x: e.clientX, y: e.clientY });
      distanceX$.set(0);
      distanceY$.set(0);
      direction$.set("none");
    });
    opts$.peek()?.onSwipeStart?.(e);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!eventIsAllowed(e) || !state.isPointerDown) return;
    const start = posStart$.peek();
    const dx = start.x - e.clientX;
    const dy = start.y - e.clientY;
    const dir = computeDirection(dx, dy);
    const becameSwiping = !state.isSwiping && dir !== "none";
    if (becameSwiping) state.isSwiping = true;
    batch(() => {
      posEnd$.set({ x: e.clientX, y: e.clientY });
      distanceX$.set(dx);
      distanceY$.set(dy);
      direction$.set(dir);
      if (becameSwiping) isSwiping$.set(true);
    });
    if (state.isSwiping) {
      opts$.peek()?.onSwipe?.(e);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!eventIsAllowed(e)) return;
    if (state.isSwiping) {
      opts$.peek()?.onSwipeEnd?.(e, direction$.peek());
    }
    state.isPointerDown = false;
    state.isSwiping = false;
    isSwiping$.set(false);
  };

  // Apply `touch-action: pan-y` and user-select toggling reactively while the
  // target is mounted; restore on unmount or target change.
  createObserve(() => {
    const el = get(target) as HTMLElement | null;
    if (!el) return;
    const prevTouchAction = el.style.getPropertyValue("touch-action");
    el.style.setProperty("touch-action", "pan-y");
    const disableTextSelect = opts$.get()?.disableTextSelect;
    if (disableTextSelect) {
      el.style.setProperty("-webkit-user-select", "none");
      el.style.setProperty("user-select", "none");
    } else {
      el.style.removeProperty("-webkit-user-select");
      el.style.removeProperty("user-select");
    }
    return () => {
      if (prevTouchAction) {
        el.style.setProperty("touch-action", prevTouchAction);
      } else {
        el.style.removeProperty("touch-action");
      }
      el.style.removeProperty("-webkit-user-select");
      el.style.removeProperty("user-select");
    };
  });

  const stopDown = createEventListener(target, "pointerdown", onPointerDown, { passive: true });
  const stopMove = createEventListener(target, "pointermove", onPointerMove, { passive: true });
  const stopUp = createEventListener(target, "pointerup", onPointerUp, { passive: true });

  const stop = () => {
    stopDown();
    stopMove();
    stopUp();
  };

  onUnmount(stop);

  return {
    isSwiping$: isSwiping$ as ReadonlyObservable<boolean>,
    direction$: direction$ as ReadonlyObservable<UseSwipeDirection>,
    distanceX$: distanceX$ as ReadonlyObservable<number>,
    distanceY$: distanceY$ as ReadonlyObservable<number>,
    posStart$: posStart$ as ReadonlyObservable<{ x: number; y: number }>,
    posEnd$: posEnd$ as ReadonlyObservable<{ x: number; y: number }>,
    stop,
  };
}
