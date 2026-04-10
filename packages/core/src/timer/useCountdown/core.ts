import { observable, type Observable } from "@legendapp/state";
import type { DeepMaybeObservable, Fn, MaybeObservable, Pausable } from "../../types";
import { createIntervalFn } from "@timer/useIntervalFn/core";

export interface CountdownOptions {
  /** Interval between ticks in ms @default 1000 */
  interval?: number;
  /** Auto-start on creation @default true */
  immediate?: boolean;
  /** Callback on each tick */
  onTick?: (remaining: number) => void;
  /** Callback when countdown reaches 0 */
  onComplete?: () => void;
}

export interface CountdownReturn extends Pausable {
  /** Current remaining count */
  remaining$: Observable<number>;
  /** Reset to initial count or custom value */
  reset: (count?: number) => void;
  /** Pause + reset (stop the countdown entirely) */
  stop: Fn;
  /** Reset to initial/custom count + resume (restart) */
  start: (count?: number) => void;
}

/**
 * Core observable function for countdown timer.
 * No React dependency — uses intervalFn core internally.
 */
export function createCountdown(
  initialCount: MaybeObservable<number>,
  options?: DeepMaybeObservable<CountdownOptions>
): CountdownReturn {
  const initialCount$ = observable(initialCount);
  const opts$ = observable(options);

  const interval = opts$.peek()?.interval ?? 1000;
  const immediate = opts$.peek()?.immediate ?? true;

  const remaining$ = observable<number>(Math.max(0, initialCount$.peek()));
  let pauseFn: Fn | null = null;

  const update = () => {
    const prev = remaining$.peek();
    const next = Math.max(0, prev - 1);
    remaining$.set(next);
    (opts$.get()?.onTick as ((n: number) => void) | undefined)?.(next);
    if (next <= 0) {
      pauseFn?.();
      (opts$.get()?.onComplete as (() => void) | undefined)?.();
    }
  };

  const controls = createIntervalFn(update, observable(interval), {
    immediate: immediate && initialCount$.peek() > 0,
  });
  pauseFn = controls.pause;

  const resume = () => {
    if (remaining$.peek() <= 0) return;
    controls.resume();
  };

  const reset = (count?: number) => {
    remaining$.set(Math.max(0, count ?? initialCount$.peek()));
  };

  const stop = () => {
    controls.pause();
    reset();
  };

  const start = (count?: number) => {
    reset(count);
    resume();
  };

  return {
    remaining$,
    isActive$: controls.isActive$,
    pause: controls.pause,
    resume,
    reset,
    stop,
    start,
  };
}
