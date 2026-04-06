import "react";
import { observable, type Observable } from "@legendapp/state";
import { useScope, onMount } from "../index";
import type { AnyFn, MaybeObservable, Pausable } from "../../../types";
import { createIntervalFnScoped } from "./createIntervalFnScoped";

/**
 * BENCHMARK ONLY — scoped variant of useIntervalFn.
 * Uses useScope() instead of useConstant + useMount.
 */
export function useIntervalFnScoped(
  cb: AnyFn,
  interval: MaybeObservable<number> = 1000,
  options?: { immediate?: boolean; immediateCallback?: boolean }
): Pausable {
  return useScope(() => {
    const interval$ =
      typeof interval === "number" ? observable(interval) : (interval as Observable<number>);

    let latestCb = cb;
    const wrappedCb = (...args: unknown[]) => latestCb(...args);

    const result = createIntervalFnScoped(wrappedCb, interval$, {
      ...options,
      immediate: false,
    });

    onMount(() => {
      if (options?.immediate ?? true) result.resume();
    });

    return result;
  });
}
