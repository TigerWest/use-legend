import { batch, observable } from "@legendapp/state";
import { type DeepMaybeObservable, type ReadonlyObservable, onUnmount } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";
import type { UseSwipeDirection } from "../usePointerSwipe/core";

export type { UseSwipeDirection };

export interface UseSwipeOptions {
  /** Minimum distance in px to trigger swipe. Default: 50 */
  threshold?: number;
  /** Callback on swipe start */
  onSwipeStart?: (e: TouchEvent) => void;
  /** Callback on swipe move */
  onSwipe?: (e: TouchEvent) => void;
  /** Callback on swipe end */
  onSwipeEnd?: (e: TouchEvent, direction: UseSwipeDirection) => void;
  /** Use passive event listeners. Default: true */
  passive?: boolean;
}

export interface UseSwipeReturn {
  /** Whether swiping is in progress */
  isSwiping$: ReadonlyObservable<boolean>;
  /** Swipe direction */
  direction$: ReadonlyObservable<UseSwipeDirection>;
  /** Horizontal swipe length (startX - currentX) */
  lengthX$: ReadonlyObservable<number>;
  /** Vertical swipe length (startY - currentY) */
  lengthY$: ReadonlyObservable<number>;
  /** Touch start coordinates */
  coordsStart$: ReadonlyObservable<{ x: number; y: number }>;
  /** Current/end touch coordinates */
  coordsEnd$: ReadonlyObservable<{ x: number; y: number }>;
  /** Stop listening */
  stop: () => void;
}

/**
 * Framework-agnostic reactive swipe detector based on TouchEvents.
 *
 * Listens to `touchstart` / `touchmove` / `touchend` on the target and tracks
 * swipe direction, length, and start/end coordinates. `threshold` and callback
 * fields are read reactively via `opts$`, so they may be swapped at runtime.
 * `passive` is consumed once at mount — AddEventListenerOptions cannot change
 * after the listener is registered.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createSwipe(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseSwipeOptions>
): UseSwipeReturn {
  const opts$ = observable(options);

  // passive is mount-time only (AddEventListenerOptions is fixed at attach time)
  const passive = opts$.peek()?.passive ?? true;

  const isSwiping$ = observable(false);
  const direction$ = observable<UseSwipeDirection>("none");
  const lengthX$ = observable(0);
  const lengthY$ = observable(0);
  const coordsStart$ = observable({ x: 0, y: 0 });
  const coordsEnd$ = observable({ x: 0, y: 0 });

  const state = {
    isTracking: false,
    isSwiping: false,
    startX: 0,
    startY: 0,
  };

  const computeDirection = (dx: number, dy: number): UseSwipeDirection => {
    const t = opts$.peek()?.threshold ?? 50;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < t) return "none";
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "left" : "right";
    }
    return dy > 0 ? "up" : "down";
  };

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    state.isTracking = true;
    state.startX = touch.clientX;
    state.startY = touch.clientY;
    batch(() => {
      coordsStart$.set({ x: touch.clientX, y: touch.clientY });
      coordsEnd$.set({ x: touch.clientX, y: touch.clientY });
      lengthX$.set(0);
      lengthY$.set(0);
      direction$.set("none");
    });
    opts$.peek()?.onSwipeStart?.(e);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!state.isTracking) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = state.startX - touch.clientX;
    const dy = state.startY - touch.clientY;
    const dir = computeDirection(dx, dy);
    const becameSwiping = !state.isSwiping && dir !== "none";
    if (becameSwiping) state.isSwiping = true;
    batch(() => {
      coordsEnd$.set({ x: touch.clientX, y: touch.clientY });
      lengthX$.set(dx);
      lengthY$.set(dy);
      direction$.set(dir);
      if (becameSwiping) isSwiping$.set(true);
    });
    if (state.isSwiping) {
      opts$.peek()?.onSwipe?.(e);
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (state.isSwiping) {
      opts$.peek()?.onSwipeEnd?.(e, direction$.peek());
    }
    state.isTracking = false;
    state.isSwiping = false;
    isSwiping$.set(false);
  };

  const listenerOpts: AddEventListenerOptions | undefined = passive ? { passive: true } : undefined;
  const stopStart = createEventListener(target, "touchstart", onTouchStart, listenerOpts);
  const stopMove = createEventListener(target, "touchmove", onTouchMove, listenerOpts);
  const stopEnd = createEventListener(target, "touchend", onTouchEnd, listenerOpts);

  const stop = () => {
    stopStart();
    stopMove();
    stopEnd();
  };

  onUnmount(stop);

  return {
    isSwiping$: isSwiping$ as ReadonlyObservable<boolean>,
    direction$: direction$ as ReadonlyObservable<UseSwipeDirection>,
    lengthX$: lengthX$ as ReadonlyObservable<number>,
    lengthY$: lengthY$ as ReadonlyObservable<number>,
    coordsStart$: coordsStart$ as ReadonlyObservable<{ x: number; y: number }>,
    coordsEnd$: coordsEnd$ as ReadonlyObservable<{ x: number; y: number }>,
    stop,
  };
}
