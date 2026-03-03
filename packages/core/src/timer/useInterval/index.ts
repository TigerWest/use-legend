"use client";
import { useObservable } from "@legendapp/state/react";
import type {
  DeepMaybeObservable,
  Fn,
  MaybeObservable,
  Pausable,
  ReadonlyObservable,
} from "../../types";
import { useMaybeObservable } from "../../function/useMaybeObservable";
import { useIntervalFn } from "../useIntervalFn";

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
  interval: MaybeObservable<number> = 1000,
  options?: DeepMaybeObservable<UseIntervalOptions<boolean>>
): ReadonlyObservable<number> | Readonly<UseIntervalReturn & Pausable> {
  // ✅ 'function' hint: callback field
  const opts$ = useMaybeObservable(options, {
    callback: "function",
  });

  // ✅ mount-time-only: .peek()
  const exposeControls = opts$.controls.peek() ?? false;
  const immediate = opts$.immediate.peek() ?? true;

  const counter$ = useObservable<number>(0);

  const update = () => {
    counter$.set(counter$.peek() + 1);
    // ✅ function hint field: opts$.peek()?.callback pattern
    opts$.peek()?.callback?.(counter$.peek());
  };

  const reset = () => counter$.set(0);

  const controls = useIntervalFn(update, interval, { immediate });

  if (exposeControls) {
    return Object.freeze({
      counter$: counter$ as ReadonlyObservable<number>,
      reset,
      ...controls,
    });
  }
  return counter$ as ReadonlyObservable<number>;
}
