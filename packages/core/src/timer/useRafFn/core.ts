import { observable } from "@legendapp/state";
import type { MaybeObservable, Pausable } from "../../types";
import { peek } from "@utilities/peek";
import { requestAnimationFrameSafe, cancelAnimationFrameSafe } from "@shared/raf";
import { onMount, onUnmount } from "@primitives/useScope";

export interface RafFnCallbackArguments {
  /** Time in ms since the previous frame. 0 on the first frame after resume(). */
  delta: number;
  /** DOMHighResTimeStamp from requestAnimationFrame. */
  timestamp: DOMHighResTimeStamp;
}

export interface RafFnOptions {
  /** If true, starts immediately on creation. @default true */
  immediate?: boolean;
  /** Cap execution to this many frames per second. null = unlimited. @default null */
  fpsLimit?: MaybeObservable<number | null>;
  /** If true, pauses after the first frame executes. @default false */
  once?: boolean;
}

/**
 * Core observable function for requestAnimationFrame loop.
 * No React dependency — uses plain observable and local state.
 */
export function createRafFn(
  fn: (args: RafFnCallbackArguments) => void,
  options?: RafFnOptions
): Pausable {
  const isActive$ = observable(false);
  let rafHandle: number | undefined;
  let lastTimestamp: DOMHighResTimeStamp = 0;

  const once = options?.once ?? false;
  const fpsLimit = options?.fpsLimit ?? null;

  const requestFrame = (cb: FrameRequestCallback) => requestAnimationFrameSafe(cb);
  const cancelFrame = (id: number) => cancelAnimationFrameSafe(id);

  const pause = () => {
    if (isActive$.peek()) isActive$.set(false);
    if (rafHandle !== undefined) {
      cancelFrame(rafHandle);
      rafHandle = undefined;
    }
  };

  const loop: FrameRequestCallback = (timestamp) => {
    if (!isActive$.peek()) {
      rafHandle = undefined;
      return;
    }

    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = timestamp - lastTimestamp;
    const fps = peek(fpsLimit);

    if (fps !== null && fps > 0 && delta < 1000 / fps) {
      if (isActive$.peek()) {
        rafHandle = requestFrame(loop);
      } else {
        rafHandle = undefined;
      }
      return;
    }

    lastTimestamp = timestamp;
    fn({ delta, timestamp });

    if (!isActive$.peek()) {
      rafHandle = undefined;
      return;
    }

    if (once) {
      pause();
      return;
    }

    rafHandle = requestFrame(loop);
  };

  const resume = () => {
    if (isActive$.peek()) return;
    if (rafHandle !== undefined) {
      cancelFrame(rafHandle);
      rafHandle = undefined;
    }
    isActive$.set(true);
    lastTimestamp = 0;
    rafHandle = requestFrame(loop);
  };

  onMount(() => {
    if (options?.immediate ?? true) resume();
  });

  onUnmount(() => {
    pause();
  });

  return {
    isActive$,
    pause,
    resume,
  };
}
