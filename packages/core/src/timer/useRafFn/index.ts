"use client";
import { useMount, useObservable } from "@legendapp/state/react";
import { useRef } from "react";
import type { MaybeObservable, Pausable } from "../../types";
import { peek } from "../../utilities/peek";
import { defaultWindow } from "../../shared/configurable";

export interface UseRafFnCallbackArguments {
  /** Time in ms since the previous frame. 0 on the first frame after resume(). */
  delta: number;
  /** DOMHighResTimeStamp from requestAnimationFrame. */
  timestamp: DOMHighResTimeStamp;
}

export interface UseRafFnOptions {
  /** If true, calls resume() immediately on mount. @default true */
  immediate?: boolean;
  /** Cap execution to this many frames per second. null = unlimited. @default null */
  fpsLimit?: MaybeObservable<number | null>;
  /** If true, pauses after the first frame executes. @default false */
  once?: boolean;
}

export function useRafFn(
  fn: (args: UseRafFnCallbackArguments) => void,
  options?: UseRafFnOptions
): Pausable {
  const isActive$ = useObservable(false);
  const rafHandle = useRef<number | undefined>(undefined);
  const lastTimestamp = useRef<DOMHighResTimeStamp>(0);
  const fnRef = useRef(fn);
  // eslint-disable-next-line react-hooks/refs -- intentional: storing latest function in ref during render (stable-ref pattern)
  fnRef.current = fn;

  // mount-time-only options
  const once = options?.once ?? false;
  const fpsLimit = options?.fpsLimit ?? null;
  const requestFrame = (cb: FrameRequestCallback) =>
    (defaultWindow?.requestAnimationFrame ?? requestAnimationFrame)(cb);
  const cancelFrame = (id: number) =>
    (defaultWindow?.cancelAnimationFrame ?? cancelAnimationFrame)(id);

  const pause = () => {
    if (isActive$.peek()) isActive$.set(false); // idempotent
    if (rafHandle.current !== undefined) {
      cancelFrame(rafHandle.current);
      rafHandle.current = undefined;
    }
  };

  const loop: FrameRequestCallback = (timestamp) => {
    if (!isActive$.peek()) {
      rafHandle.current = undefined;
      return;
    }

    // First frame after resume: set base timestamp so delta = 0 (not the full DOMHighResTimeStamp).
    if (!lastTimestamp.current) lastTimestamp.current = timestamp;
    const delta = timestamp - lastTimestamp.current;
    // Poll latest fpsLimit value without registering tracking deps.
    const fps = peek(fpsLimit);

    if (fps !== null && fps > 0 && delta < 1000 / fps) {
      if (isActive$.peek()) {
        rafHandle.current = requestFrame(loop);
      } else {
        rafHandle.current = undefined;
      }
      return;
    }

    lastTimestamp.current = timestamp;
    fnRef.current({ delta, timestamp });

    // fn may call pause(), so re-check before scheduling next frame
    if (!isActive$.peek()) {
      rafHandle.current = undefined;
      return;
    }

    if (once) {
      pause();
      return;
    }

    rafHandle.current = requestFrame(loop);
  };

  const resume = () => {
    if (!defaultWindow) return; // SSR guard
    if (isActive$.peek()) return; // idempotent
    if (rafHandle.current !== undefined) {
      cancelFrame(rafHandle.current);
      rafHandle.current = undefined;
    }
    isActive$.set(true);
    lastTimestamp.current = 0; // reset on resume; first-frame guard sets it to actual timestamp
    rafHandle.current = requestFrame(loop);
  };

  useMount(() => {
    if (options?.immediate ?? true) resume();
    return () => pause();
  });

  return { isActive$, pause, resume };
}
