import { observable, type Observable } from "@legendapp/state";
import type { Disposable, Pausable } from "../../types";
import { rafFn } from "@timer/useRafFn/core";

export interface FpsOptions {
  /**
   * Sample FPS every N frames (reduces noise)
   * @default 10
   */
  every?: number;
  /** If true, starts immediately. @default true */
  immediate?: boolean;
}

/**
 * Core observable function for FPS measurement.
 * No React dependency — uses rafFn core internally.
 */
export function fps(options?: FpsOptions): Disposable & Pausable & { fps$: Observable<number> } {
  const every = options?.every ?? 10;
  const fps$ = observable<number>(0);
  let last: number | null = null;
  let ticks = 0;

  const result = rafFn(
    ({ timestamp }) => {
      if (last === null) last = timestamp;
      ticks += 1;
      if (ticks >= every) {
        const diff = timestamp - last;
        fps$.set(Math.round(1000 / (diff / ticks)));
        last = timestamp;
        ticks = 0;
      }
    },
    { immediate: options?.immediate ?? true }
  );

  return { fps$, ...result };
}
