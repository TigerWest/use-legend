import { observable, type Observable } from "@legendapp/state";
import { observe, onMount, onUnmount } from "@primitives/useScope";
import type { AnyFn, Pausable } from "../../types";

export interface IntervalFnOptions {
  /** If true, calls resume() immediately. @default true */
  immediate?: boolean;
  /** If true, calls fn immediately when resume() is called. @default false */
  immediateCallback?: boolean;
}

/**
 * Core observable function for setInterval with pause/resume.
 * No React dependency — uses observable() and observe().
 */
export function createIntervalFn(
  fn: AnyFn,
  interval$: Observable<number>,
  options?: IntervalFnOptions
): Pausable {
  const isActive$ = observable(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const immediateCallback = options?.immediateCallback ?? false;

  const cleanupTimer = () => {
    clearInterval(timer);
    timer = undefined;
  };

  const pause = () => {
    if (!isActive$.peek()) return;
    isActive$.set(false);
    cleanupTimer();
  };

  const resume = () => {
    if (isActive$.peek()) return;
    isActive$.set(true);
    if (immediateCallback) fn();
    const ms = interval$.peek();
    timer = setInterval(() => fn(), ms);
  };

  // Reactive: restart interval when interval$ changes while active.
  // Tracks only interval$ (isActive$ via peek — no dep).
  observe(() => {
    const ms = interval$.get(); // register dep on interval$
    cleanupTimer();
    if (isActive$.peek()) {
      timer = setInterval(() => fn(), ms);
    }
  });

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
