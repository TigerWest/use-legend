"use client";
import { useMount } from "@legendapp/state/react";
import type { DeepMaybeObservable, Pausable, ReadonlyObservable } from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { usePeekInitial } from "@reactivity/usePeekInitial";
import { useConstant } from "@shared/useConstant";
import { now } from "./core";

export { now } from "./core";
export type { NowOptions } from "./core";

export interface UseNowOptions<Controls extends boolean = false> {
  /**
   * Whether to expose controls (pause/resume) — mount-time-only
   * @default false
   */
  controls?: Controls;
  /**
   * Update interval — mount-time-only (determines scheduler type)
   * - 'requestAnimationFrame': rAF-based (default, smoother)
   * - number: ms-based setInterval (battery friendly)
   * @default 'requestAnimationFrame'
   */
  interval?: "requestAnimationFrame" | number;
}

export function useNow(options?: UseNowOptions<false>): ReadonlyObservable<Date>;
export function useNow(options: UseNowOptions<true>): { now$: ReadonlyObservable<Date> } & Pausable;
export function useNow(
  options?: DeepMaybeObservable<UseNowOptions<boolean>>
): ReadonlyObservable<Date> | ({ now$: ReadonlyObservable<Date> } & Pausable) {
  const opts$ = useMaybeObservable(options);

  const exposeControls = usePeekInitial(opts$.controls, false);
  const interval = usePeekInitial(opts$.interval, "requestAnimationFrame" as const);

  const result = useConstant(() => now({ interval, immediate: false }));

  useMount(() => {
    result.resume();
    return () => result.dispose();
  });

  if (exposeControls) {
    return {
      now$: result.now$ as ReadonlyObservable<Date>,
      isActive$: result.isActive$,
      pause: result.pause,
      resume: result.resume,
    };
  }
  return result.now$ as ReadonlyObservable<Date>;
}
