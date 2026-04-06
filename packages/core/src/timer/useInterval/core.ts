import { observable, type Observable } from "@legendapp/state";
import type { Disposable, Fn, MaybeObservable, Pausable } from "../../types";
import { createIntervalFn } from "@timer/useIntervalFn/core";

export interface IntervalOptions {
  /** If true, starts immediately. @default true */
  immediate?: boolean;
  /** Callback invoked on every tick (receives current counter value) */
  callback?: (count: number) => void;
}

export interface IntervalReturn {
  counter$: Observable<number>;
  reset: Fn;
}

/**
 * Core observable function for reactive counter with setInterval.
 * No React dependency — uses intervalFn core internally.
 */
export function createInterval(
  interval: MaybeObservable<number>,
  options?: IntervalOptions
): Disposable & IntervalReturn & Pausable {
  const interval$ = observable(interval);
  const counter$ = observable<number>(0);
  const callback = options?.callback;

  const update = () => {
    counter$.set(counter$.peek() + 1);
    callback?.(counter$.peek());
  };

  const reset = () => counter$.set(0);

  const result = createIntervalFn(update, interval$, {
    immediate: options?.immediate ?? true,
  });

  return {
    counter$,
    reset,
    ...result,
  };
}
