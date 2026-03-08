import { observable } from "@legendapp/state";
import type { AnyFn, Disposable, Stoppable } from "../../types";

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
 * @param getInterval - Getter that returns the delay in ms (read at each start() call).
 * @param options - Mount-time-only options.
 */
export function createTimeoutFn<CallbackFn extends AnyFn>(
  cb: CallbackFn,
  getInterval: () => number,
  options?: TimeoutFnOptions
): Disposable & Stoppable<Parameters<CallbackFn> | []> {
  const isPending$ = observable(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const immediateCallback = options?.immediateCallback ?? false;

  const stop = () => {
    clearTimeout(timer);
    timer = undefined;
    isPending$.set(false);
  };

  const start = (...args: Parameters<CallbackFn> | []) => {
    stop();
    if (immediateCallback) cb();
    isPending$.set(true);
    const ms = getInterval();
    timer = setTimeout(() => {
      isPending$.set(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- forwarding variadic args to callback
      cb(...(args as any));
    }, ms);
  };

  if (options?.immediate ?? true) start();

  return {
    isPending$,
    stop,
    start,
    dispose: () => stop(),
  };
}
