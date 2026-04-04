"use client";
import type { ReadonlyObservable, DeepMaybeObservable } from "@usels/core";
import { useMaybeObservable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { batch } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { useEventListener } from "@browser/useEventListener";
import type { UseSwipeDirection } from "../usePointerSwipe";

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

/*@__NO_SIDE_EFFECTS__*/
export function useSwipe(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseSwipeOptions>
): UseSwipeReturn {
  const opts$ = useMaybeObservable(options, {
    onSwipeStart: "function",
    onSwipe: "function",
    onSwipeEnd: "function",
  });

  // passive is mount-time-only (Rule 3 — event listener option decided at attach time)
  const passive = useConstant(() => opts$.passive.peek() ?? true);

  const isSwiping$ = useObservable(false);
  const direction$ = useObservable<UseSwipeDirection>("none");
  const lengthX$ = useObservable(0);
  const lengthY$ = useObservable(0);
  const coordsStart$ = useObservable({ x: 0, y: 0 });
  const coordsEnd$ = useObservable({ x: 0, y: 0 });

  const stateRef = useConstant<{
    isTracking: boolean;
    isSwiping: boolean;
    startX: number;
    startY: number;
  }>(() => ({
    isTracking: false,
    isSwiping: false,
    startX: 0,
    startY: 0,
  }));

  const computeDirection = useConstant(() => (dx: number, dy: number): UseSwipeDirection => {
    const t = opts$.peek()?.threshold ?? 50;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < t) return "none";
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "left" : "right";
    }
    return dy > 0 ? "up" : "down";
  });

  const onTouchStart = useConstant(() => (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    stateRef.isTracking = true;
    stateRef.startX = touch.clientX;
    stateRef.startY = touch.clientY;
    batch(() => {
      coordsStart$.set({ x: touch.clientX, y: touch.clientY });
      coordsEnd$.set({ x: touch.clientX, y: touch.clientY });
      lengthX$.set(0);
      lengthY$.set(0);
      direction$.set("none");
    });
    opts$.peek()?.onSwipeStart?.(e);
  });

  const onTouchMove = useConstant(() => (e: TouchEvent) => {
    if (!stateRef.isTracking) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = stateRef.startX - touch.clientX;
    const dy = stateRef.startY - touch.clientY;
    const dir = computeDirection(dx, dy);
    const becameSwiping = !stateRef.isSwiping && dir !== "none";
    if (becameSwiping) stateRef.isSwiping = true;
    batch(() => {
      coordsEnd$.set({ x: touch.clientX, y: touch.clientY });
      lengthX$.set(dx);
      lengthY$.set(dy);
      direction$.set(dir);
      if (becameSwiping) isSwiping$.set(true);
    });
    if (stateRef.isSwiping) {
      opts$.peek()?.onSwipe?.(e);
    }
  });

  const onTouchEnd = useConstant(() => (e: TouchEvent) => {
    if (stateRef.isSwiping) {
      opts$.peek()?.onSwipeEnd?.(e, direction$.peek());
    }
    stateRef.isTracking = false;
    stateRef.isSwiping = false;
    isSwiping$.set(false);
  });

  const listenerOpts = passive ? { passive: true } : undefined;
  const stopStart = useEventListener(target, "touchstart", onTouchStart, listenerOpts);
  const stopMove = useEventListener(target, "touchmove", onTouchMove, listenerOpts);
  const stopEnd = useEventListener(target, "touchend", onTouchEnd, listenerOpts);

  const stop = useConstant(() => () => {
    stopStart();
    stopMove();
    stopEnd();
  });

  return {
    isSwiping$,
    direction$,
    lengthX$,
    lengthY$,
    coordsStart$,
    coordsEnd$,
    stop,
  };
}
