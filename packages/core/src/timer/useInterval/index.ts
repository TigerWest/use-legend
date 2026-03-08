"use client";
import type { Observable } from "@legendapp/state";
import { useMount } from "@legendapp/state/react";
import type {
  DeepMaybeObservable,
  Fn,
  MaybeObservable,
  Pausable,
  ReadonlyObservable,
} from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { interval } from "./core";

export { interval } from "./core";
export type { IntervalOptions, IntervalReturn } from "./core";

export interface UseIntervalOptions<Controls extends boolean = false> {
  controls?: Controls;
  /**
   * Auto-start immediately after mount — mount-time-only
   * @default true
   */
  immediate?: boolean;
  /** Callback invoked on every tick (receives current counter value) — function hint */
  callback?: (count: number) => void;
}

export interface UseIntervalReturn {
  counter$: ReadonlyObservable<number>;
  reset: Fn;
}

export function useInterval(
  interval?: MaybeObservable<number>,
  options?: UseIntervalOptions<false>
): ReadonlyObservable<number>;
export function useInterval(
  interval: MaybeObservable<number>,
  options: UseIntervalOptions<true>
): Readonly<UseIntervalReturn & Pausable>;
export function useInterval(
  intervalValue: MaybeObservable<number> = 1000,
  options?: DeepMaybeObservable<UseIntervalOptions<boolean>>
): ReadonlyObservable<number> | Readonly<UseIntervalReturn & Pausable> {
  const opts$ = useMaybeObservable(options, {
    callback: "function",
  });
  const interval$ = useMaybeObservable(intervalValue);

  const exposeControls = opts$.controls.peek() ?? false;
  const immediate = opts$.immediate.peek() ?? true;
  const callbackRef = useLatest(opts$.peek()?.callback);

  const result = useConstant(() =>
    interval(interval$ as unknown as Observable<number>, {
      immediate: false,
      callback: (count: number) => callbackRef.current?.(count),
    })
  );

  useMount(() => {
    if (immediate) result.resume();
    return () => result.dispose();
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
}
