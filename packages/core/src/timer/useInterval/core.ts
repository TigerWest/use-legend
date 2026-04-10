import { observable, type Observable } from "@legendapp/state";
import type { DeepMaybeObservable, Fn, MaybeObservable, Pausable } from "../../types";
import { createIntervalFn } from "@timer/useIntervalFn/core";

export interface IntervalOptions {
  /** Expose pause/resume/reset controls — mount-time-only */
  controls?: boolean;
  /** If true, starts immediately. @default true */
  immediate?: boolean;
  /** Callback invoked on every tick (receives current counter value) */
  callback?: (count: number) => void;
}

export interface IntervalReturn {
  counter$: Observable<number>;
  reset: Fn;
}

export function createInterval(
  interval: MaybeObservable<number>,
  options?: DeepMaybeObservable<IntervalOptions & { controls?: false }>
): Observable<number>;
export function createInterval(
  interval: MaybeObservable<number>,
  options: DeepMaybeObservable<IntervalOptions & { controls: true }>
): IntervalReturn & Pausable;
export function createInterval(
  interval: MaybeObservable<number>,
  options?: DeepMaybeObservable<IntervalOptions>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const interval$ = observable(interval);
  const opts$ = observable(options);
  const counter$ = observable<number>(0);

  const exposeControls = opts$.peek()?.controls ?? false;

  const update = () => {
    counter$.set(counter$.peek() + 1);
    opts$.get()?.callback?.(counter$.peek());
  };

  const reset = () => counter$.set(0);

  const result = createIntervalFn(update, interval$, {
    immediate: opts$.peek()?.immediate ?? true,
  });

  if (exposeControls) {
    return { counter$, reset, ...result };
  }
  return counter$;
}
