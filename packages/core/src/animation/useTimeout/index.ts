"use client";
import { useObservable, useObserve } from "@legendapp/state/react";
import type {
  DeepMaybeObservable,
  Fn,
  MaybeObservable,
  ReadonlyObservable,
  Stoppable,
} from "../../types";
import { useMaybeObservable } from "../../function/useMaybeObservable";
import { useTimeoutFn } from "../useTimeoutFn";

export interface UseTimeoutOptions<Controls extends boolean = false> {
  controls?: Controls;
  /** Callback invoked on timeout completion — function hint */
  callback?: Fn;
  /**
   * Auto-start immediately after mount — mount-time-only
   * @default true
   */
  immediate?: boolean;
}

export function useTimeout(
  interval?: MaybeObservable<number>,
  options?: UseTimeoutOptions<false>
): ReadonlyObservable<boolean>;
export function useTimeout(
  interval: MaybeObservable<number>,
  options: UseTimeoutOptions<true>
): { ready: ReadonlyObservable<boolean> } & Stoppable;
export function useTimeout(
  interval: MaybeObservable<number> = 1000,
  options?: DeepMaybeObservable<UseTimeoutOptions<boolean>>
): ReadonlyObservable<boolean> | ({ ready: ReadonlyObservable<boolean> } & Stoppable) {
  // ✅ 'function' hint: callback field
  const opts$ = useMaybeObservable(options, {
    callback: "function",
  });

  // ✅ mount-time-only: .peek()
  const exposeControls = opts$.controls.peek() ?? false;
  const immediate = opts$.immediate.peek() ?? true;

  // ready$ tracks natural completion only (stop() does NOT set ready=true)
  const ready$ = useObservable(false);

  // ✅ callback accessed via opts$.peek()?.callback pattern
  // Note: explicit cast needed — TypeScript cannot infer Fn type in generic useTimeoutFn<CallbackFn> context
  const controls = useTimeoutFn(
    (): void => {
      ready$.set(true); // fired naturally → ready
      (opts$.peek()?.callback as Fn | undefined)?.();
    },
    interval,
    { immediate }
  );

  // Reset ready$ when a new timeout starts (isPending becomes true)
  useObserve(() => {
    if (controls.isPending$.get()) ready$.set(false);
  });

  if (exposeControls) {
    return { ready: ready$ as ReadonlyObservable<boolean>, ...controls };
  }
  return ready$ as ReadonlyObservable<boolean>;
}
