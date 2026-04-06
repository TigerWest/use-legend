import "react";
import { observable, type Observable } from "@legendapp/state";
import { useScope, onMount } from "../index";
import type { Fn, MaybeObservable, Pausable, ReadonlyObservable } from "../../../types";
import { createIntervalScoped } from "./createIntervalScoped";

export interface UseIntervalReturn {
  counter$: ReadonlyObservable<number>;
  reset: Fn;
}

/**
 * BENCHMARK ONLY — scoped variant of useInterval.
 * Uses useScope() instead of useConstant + useMount.
 */
export function useIntervalScoped(
  interval: MaybeObservable<number> = 1000,
  options?: { immediate?: boolean; controls?: boolean; callback?: (count: number) => void }
): ReadonlyObservable<number> | Readonly<UseIntervalReturn & Pausable> {
  const exposeControls = options?.controls ?? false;

  return useScope(() => {
    const interval$ =
      typeof interval === "number" ? observable(interval) : (interval as Observable<number>);

    const result = createIntervalScoped(interval$, {
      ...options,
      immediate: false,
    });

    onMount(() => {
      if (options?.immediate ?? true) result.resume();
    });

    if (exposeControls) {
      return Object.freeze({
        counter$: result.counter$ as ReadonlyObservable<number>,
        reset: result.reset,
        isActive$: result.isActive$,
        pause: result.pause,
        resume: result.resume,
      });
    }
    return result.counter$ as ReadonlyObservable<number>;
  });
}
