import { observable, observe, type Observable } from "@legendapp/state";
import type { Disposable, Fn, Stoppable } from "../../types";
import { createTimeoutFn } from "@timer/useTimeoutFn/core";

export interface TimeoutOptions {
  /** Callback invoked on timeout completion */
  callback?: Fn;
  /**
   * Auto-start immediately.
   * @default true
   */
  immediate?: boolean;
}

/**
 * Core observable function for reactive timeout readiness.
 * No React dependency — uses timeoutFn core internally.
 */
export function createTimeout(
  interval$: Observable<number>,
  options?: TimeoutOptions
): Disposable & Stoppable & { ready$: Observable<boolean> } {
  const ready$ = observable(false);

  const result = createTimeoutFn(
    (): void => {
      ready$.set(true);
      options?.callback?.();
    },
    () => interval$.peek(),
    { immediate: options?.immediate ?? true }
  );

  // Reset ready$ when a new timeout starts (isPending becomes true)
  const unsub = observe(() => {
    if (result.isPending$.get()) ready$.set(false);
  });

  return {
    ready$,
    isPending$: result.isPending$,
    stop: result.stop,
    start: result.start,
    dispose: () => {
      result.dispose();
      unsub();
    },
  };
}
