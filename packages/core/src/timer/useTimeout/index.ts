"use client";
import type { Observable } from "@legendapp/state";
import { useMount } from "@legendapp/state/react";
import type {
  DeepMaybeObservable,
  Fn,
  MaybeObservable,
  ReadonlyObservable,
  Stoppable,
} from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { createTimeout } from "./core";

export { createTimeout } from "./core";
export type { TimeoutOptions } from "./core";

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
): { ready$: ReadonlyObservable<boolean> } & Stoppable;
export function useTimeout(
  interval: MaybeObservable<number> = 1000,
  options?: DeepMaybeObservable<UseTimeoutOptions<boolean>>
): ReadonlyObservable<boolean> | ({ ready$: ReadonlyObservable<boolean> } & Stoppable) {
  const opts$ = useMaybeObservable(options, { callback: "function" });
  const interval$ = useMaybeObservable(interval);

  const exposeControls = opts$.controls.peek() ?? false;
  const immediate = opts$.immediate.peek() ?? true;
  const callbackRef = useLatest(opts$.peek()?.callback);

  const result = useConstant(() =>
    createTimeout(interval$ as unknown as Observable<number>, {
      immediate: false,
      callback: () => (callbackRef.current as Fn | undefined)?.(),
    })
  );

  useMount(() => {
    if (immediate) result.start();
    return () => result.dispose();
  });

  if (exposeControls) {
    return {
      ready$: result.ready$ as ReadonlyObservable<boolean>,
      isPending$: result.isPending$,
      stop: result.stop,
      start: result.start,
    };
  }
  return result.ready$ as ReadonlyObservable<boolean>;
}
