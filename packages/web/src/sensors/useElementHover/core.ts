import { observable } from "@legendapp/state";
import { onUnmount, type DeepMaybeObservable, type ReadonlyObservable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { createEventListener } from "../../browser/useEventListener/core";

export interface UseElementHoverOptions {
  /** Delay in ms before entering hover state */
  delayEnter?: number;
  /** Delay in ms before leaving hover state */
  delayLeave?: number;
}

export type UseElementHoverReturn = ReadonlyObservable<boolean>;

/**
 * Framework-agnostic reactive element hover tracker.
 *
 * Tracks whether a target element is being hovered via `mouseenter` /
 * `mouseleave` events. Supports optional enter/leave delays.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createElementHover(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseElementHoverOptions>
): UseElementHoverReturn {
  const opts$ = observable(options);
  const isHovered$ = observable(false);

  let timer: ReturnType<typeof setTimeout> | undefined;

  const cleanup = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const toggle = (entering: boolean) => {
    const delay = entering ? (opts$.peek()?.delayEnter ?? 0) : (opts$.peek()?.delayLeave ?? 0);
    cleanup();
    if (delay > 0) {
      timer = setTimeout(() => isHovered$.set(entering), delay);
    } else {
      isHovered$.set(entering);
    }
  };

  onUnmount(cleanup);

  createEventListener(target, "mouseenter", () => toggle(true), { passive: true });
  createEventListener(target, "mouseleave", () => toggle(false), { passive: true });

  return isHovered$ as ReadonlyObservable<boolean>;
}
