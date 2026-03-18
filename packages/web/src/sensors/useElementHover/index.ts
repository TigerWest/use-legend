"use client";
import type { ReadonlyObservable, DeepMaybeObservable } from "@usels/core";
import { useMaybeObservable } from "@usels/core";
import { useObservable } from "@legendapp/state/react";
import { useUnmount } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { type MaybeElement } from "@usels/core";
import { useEventListener } from "@browser/useEventListener";

export interface UseElementHoverOptions {
  /** Delay in ms before entering hover state */
  delayEnter?: number;
  /** Delay in ms before leaving hover state */
  delayLeave?: number;
}

/*@__NO_SIDE_EFFECTS__*/
export function useElementHover(
  target: MaybeElement | EventTarget,
  options?: DeepMaybeObservable<UseElementHoverOptions>
): ReadonlyObservable<boolean> {
  const opts$ = useMaybeObservable(options);

  const isHovered$ = useObservable(false);

  const { toggle, cleanup } = useConstant(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
      toggle: (entering: boolean) => {
        const delay = entering ? (opts$.peek()?.delayEnter ?? 0) : (opts$.peek()?.delayLeave ?? 0);
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
        if (delay > 0) {
          timer = setTimeout(() => isHovered$.set(entering), delay);
        } else {
          isHovered$.set(entering);
        }
      },
      cleanup: () => {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
    };
  });

  useUnmount(cleanup);

  useEventListener(target, "mouseenter", () => toggle(true), { passive: true });
  useEventListener(target, "mouseleave", () => toggle(false), { passive: true });

  return isHovered$ as ReadonlyObservable<boolean>;
}
