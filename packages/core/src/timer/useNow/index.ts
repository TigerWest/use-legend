"use client";
import { useScope } from "@primitives/useScope";
import { peek } from "@utilities/peek";
import type { DeepMaybeObservable, Pausable, ReadonlyObservable } from "../../types";
import { createNow } from "./core";

export { createNow } from "./core";
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
  const rawOpts = peek(options);
  const exposeControls = rawOpts?.controls ?? false;
  const interval = rawOpts?.interval ?? ("requestAnimationFrame" as const);

  return useScope(() => {
    const result = createNow({ interval });

    if (exposeControls) {
      return {
        now$: result.now$ as ReadonlyObservable<Date>,
        isActive$: result.isActive$,
        pause: result.pause,
        resume: result.resume,
      };
    }
    return result.now$ as ReadonlyObservable<Date>;
  });
}
