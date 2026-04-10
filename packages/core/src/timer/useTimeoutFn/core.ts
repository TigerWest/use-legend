import { observable } from "@legendapp/state";
import { onMount, onUnmount } from "@primitives/useScope";
import type { AnyFn, MaybeObservable, Stoppable } from "../../types";
import { peek } from "@utilities/peek";

export interface TimeoutFnOptions {
  /** If true, calls start() immediately. @default true */
  immediate?: boolean;
  /** If true, calls cb() immediately (no args) when start() is called, then again after the delay with the original args. @default false */
  immediateCallback?: boolean;
}

/**
 * Core observable function for setTimeout with stop/start.
 * No React dependency — uses observable().
 *
 * @param cb - Callback to invoke after the delay.
 * @param interval$ - Observable that returns the delay in ms (read at each start() call).
 * @param options - Mount-time-only options.
 */
export function createTimeoutFn(
  cb: AnyFn,
  interval$: MaybeObservable<number>,
  options?: TimeoutFnOptions
): Stoppable {
  const isPending$ = observable(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const immediateCallback = options?.immediateCallback ?? false;

  const stop = () => {
    clearTimeout(timer);
    timer = undefined;
    isPending$.set(false);
  };

  const start = (...args: unknown[]) => {
    stop();
    if (immediateCallback) cb();
    isPending$.set(true);
    const ms = peek(interval$);
    timer = setTimeout(() => {
      isPending$.set(false);
      cb(...args);
    }, ms);
  };

  onMount(() => {
    if (options?.immediate ?? true) start();
  });
  onUnmount(() => {
    stop();
  });

  return { isPending$, stop, start };
}
