"use client";
import type { ReadonlyObservable, MaybeElement, DeepMaybeObservable } from "@usels/core";
import { getElement } from "@usels/core";
import { useMaybeObservable } from "@usels/core";
import { batch } from "@legendapp/state";
import { useObservable, useObserve } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { useEventListener } from "@browser/useEventListener";

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

/*@__NO_SIDE_EFFECTS__*/
export function usePointerSwipe(
  target: MaybeElement,
  options?: DeepMaybeObservable<UsePointerSwipeOptions>
): UsePointerSwipeReturn {
  const opts$ = useMaybeObservable(options, {
    onSwipeStart: "function",
    onSwipe: "function",
    onSwipeEnd: "function",
  });

  const isSwiping$ = useObservable(false);
  const direction$ = useObservable<UseSwipeDirection>("none");
  const distanceX$ = useObservable(0);
  const distanceY$ = useObservable(0);
  const posStart$ = useObservable({ x: 0, y: 0 });
  const posEnd$ = useObservable({ x: 0, y: 0 });

  const stateRef = useConstant<{
    isPointerDown: boolean;
    isSwiping: boolean;
  }>(() => ({
    isPointerDown: false,
    isSwiping: false,
  }));

  const eventIsAllowed = useConstant(() => (e: PointerEvent): boolean => {
    const types = opts$.peek()?.pointerTypes;
    if (types) return types.includes(e.pointerType as PointerType);
    return true;
  });

  const computeDirection = useConstant(() => (dx: number, dy: number): UseSwipeDirection => {
    const t = opts$.peek()?.threshold ?? 50;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < t) return "none";
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "left" : "right";
    }
    return dy > 0 ? "up" : "down";
  });

  const onPointerDown = useConstant(() => (e: PointerEvent) => {
    if (!eventIsAllowed(e)) return;
    stateRef.isPointerDown = true;
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
  });

  const onPointerMove = useConstant(() => (e: PointerEvent) => {
    if (!eventIsAllowed(e) || !stateRef.isPointerDown) return;
    const start = posStart$.peek();
    const dx = start.x - e.clientX;
    const dy = start.y - e.clientY;
    const dir = computeDirection(dx, dy);
    const becameSwiping = !stateRef.isSwiping && dir !== "none";
    if (becameSwiping) stateRef.isSwiping = true;
    batch(() => {
      posEnd$.set({ x: e.clientX, y: e.clientY });
      distanceX$.set(dx);
      distanceY$.set(dy);
      direction$.set(dir);
      if (becameSwiping) isSwiping$.set(true);
    });
    if (stateRef.isSwiping) {
      opts$.peek()?.onSwipe?.(e);
    }
  });

  const onPointerUp = useConstant(() => (e: PointerEvent) => {
    if (!eventIsAllowed(e)) return;
    if (stateRef.isSwiping) {
      opts$.peek()?.onSwipeEnd?.(e, direction$.peek());
    }
    stateRef.isPointerDown = false;
    stateRef.isSwiping = false;
    isSwiping$.set(false);
  });

  useObserve(() => {
    const el = getElement(target) as HTMLElement | null;
    if (!el) return;
    const prevTouchAction = el.style.getPropertyValue("touch-action");
    el.style.setProperty("touch-action", "pan-y");
    if (opts$.disableTextSelect.get()) {
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

  const stopDown = useEventListener(target, "pointerdown", onPointerDown, { passive: true });
  const stopMove = useEventListener(target, "pointermove", onPointerMove, { passive: true });
  const stopUp = useEventListener(target, "pointerup", onPointerUp, { passive: true });

  const stop = useConstant(() => () => {
    stopDown();
    stopMove();
    stopUp();
  });

  return {
    isSwiping$,
    direction$,
    distanceX$,
    distanceY$,
    posStart$,
    posEnd$,
    stop,
  };
}
