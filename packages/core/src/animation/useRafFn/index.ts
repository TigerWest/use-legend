"use client";
import { useMount, useObservable } from "@legendapp/state/react";
import { useRef } from "react";
import type { MaybeObservable, Pausable } from "../../types";
import { get } from "../../function/get";
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

  const pause = () => {
    if (!isActive$.peek()) return; // idempotent
    isActive$.set(false);
    if (rafHandle.current !== undefined) {
      cancelAnimationFrame(rafHandle.current);
      rafHandle.current = undefined;
    }
  };

  const loop: FrameRequestCallback = (timestamp) => {
    if (!isActive$.peek()) return;

    // First frame after resume: set base timestamp so delta = 0 (not the full DOMHighResTimeStamp).
    if (!lastTimestamp.current) lastTimestamp.current = timestamp;
    const delta = timestamp - lastTimestamp.current;
    const fps = get(fpsLimit); // read every frame — reactive to fpsLimit changes

    if (fps !== null && fps > 0 && delta < 1000 / fps) {
      rafHandle.current = requestAnimationFrame(loop);
      return;
    }

    lastTimestamp.current = timestamp;
    fnRef.current({ delta, timestamp });

    if (once) {
      pause();
      return;
    }

    rafHandle.current = requestAnimationFrame(loop);
  };

  const resume = () => {
    if (!defaultWindow) return; // SSR guard
    if (isActive$.peek()) return; // idempotent
    isActive$.set(true);
    lastTimestamp.current = 0; // reset on resume; first-frame guard sets it to actual timestamp
    rafHandle.current = requestAnimationFrame(loop);
  };

  useMount(() => {
    if (options?.immediate ?? true) resume();
    return () => pause();
  });

  return { isActive$, pause, resume };
}
