import { observable, type Observable } from "@legendapp/state";
import type { Fn, Pausable } from "../../../types";
import { createIntervalFnScoped } from "./createIntervalFnScoped";

export interface IntervalOptions {
  immediate?: boolean;
  callback?: (count: number) => void;
}

export interface IntervalReturn {
  counter$: Observable<number>;
  reset: Fn;
}

/**
 * BENCHMARK ONLY — scoped variant of createInterval.
 * Composes createIntervalFnScoped; cleanup via scope propagation.
 * Must be called inside a scope.run() or useScope() factory.
 */
export function createIntervalScoped(
  interval$: Observable<number>,
  options?: IntervalOptions
): IntervalReturn & Pausable {
  const counter$ = observable<number>(0);
  const callback = options?.callback;

  const update = () => {
    counter$.set(counter$.peek() + 1);
    callback?.(counter$.peek());
  };

  const reset = () => counter$.set(0);

  const result = createIntervalFnScoped(update, interval$, {
    immediate: options?.immediate ?? true,
  });

  return {
    counter$,
    reset,
    ...result,
  };
}
