import { observable, type Observable } from "@legendapp/state";
import { createObserve } from "@primitives/useScope";
import type { DeepMaybeObservable, Fn, MaybeObservable, Stoppable } from "../../types";
import { createTimeoutFn } from "@timer/useTimeoutFn/core";

export interface TimeoutOptions {
  controls?: boolean;
  /** Callback invoked on timeout completion */
  callback?: Fn;
  /**
   * Auto-start immediately.
   * @default true
   */
  immediate?: boolean;
}

export interface TimeoutReturn {
  ready$: Observable<boolean>;
}

/**
 * Core observable function for reactive timeout readiness.
 * No React dependency — uses timeoutFn core internally.
 */
export function createTimeout(
  interval: MaybeObservable<number>,
  options?: DeepMaybeObservable<TimeoutOptions & { controls?: false }>
): Observable<boolean>;
export function createTimeout(
  interval: MaybeObservable<number>,
  options: DeepMaybeObservable<TimeoutOptions & { controls: true }>
): TimeoutReturn & Stoppable;
export function createTimeout(
  interval: MaybeObservable<number>,
  options?: DeepMaybeObservable<TimeoutOptions>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const interval$ = observable(interval);
  const opts$ = observable(options);
  const ready$ = observable(false);
  const exposeControls = opts$.peek()?.controls ?? false;

  const result = createTimeoutFn(
    (): void => {
      ready$.set(true);
      const cb = opts$.peek()?.callback;
      if (typeof cb === "function") cb();
    },
    interval$,
    { immediate: opts$.peek()?.immediate ?? true }
  );

  // Reset ready$ when a new timeout starts (isPending becomes true)
  createObserve(() => {
    if (result.isPending$.get()) ready$.set(false);
  });

  if (exposeControls) {
    return {
      ready$,
      isPending$: result.isPending$,
      stop: result.stop,
      start: result.start,
    };
  }
  return ready$;
}
