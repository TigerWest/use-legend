"use client";
import { useMount, useObservable, useObserveEffect } from "@legendapp/state/react";
import { useRef } from "react";
import { useLatest } from "@shared/useLatest";
import type { AnyFn, MaybeObservable, Pausable } from "../../types";
import { get } from "@utilities/get";

export interface UseIntervalFnOptions {
  /** If true, calls resume() immediately on mount. @default true */
  immediate?: boolean;
  /** If true, calls cb immediately when resume() is called. @default false */
  immediateCallback?: boolean;
}

export function useIntervalFn(
  cb: AnyFn,
  interval: MaybeObservable<number> = 1000,
  options?: UseIntervalFnOptions
): Pausable {
  const isActive$ = useObservable(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const cbRef = useLatest(cb);

  // mount-time-only — read directly without reactive tracking
  const immediateCallback = options?.immediateCallback ?? false;

  const cleanupTimer = () => {
    clearInterval(timer.current);
    timer.current = undefined;
  };

  const pause = () => {
    if (!isActive$.peek()) return; // idempotent
    isActive$.set(false);
    cleanupTimer();
  };

  const resume = () => {
    if (isActive$.peek()) return; // idempotent
    isActive$.set(true);
    if (immediateCallback) cbRef.current();
    const ms = get(interval);
    timer.current = setInterval(() => cbRef.current(), ms);
  };

  // Reactive: restart interval when interval value changes while active.
  // Tracks only `interval` dep (isActive$ via peek — no dep) to avoid
  // double-start when resume() sets isActive$ and this effect re-runs.
  useObserveEffect((e) => {
    e.onCleanup = cleanupTimer;
    const ms = get(interval); // register dep on interval
    if (isActive$.peek()) {
      // peek: no dep on isActive$
      timer.current = setInterval(() => cbRef.current(), ms);
    }
  });

  useMount(() => {
    if (options?.immediate ?? true) resume();
    return () => pause();
  });

  return { isActive$, pause, resume };
}
