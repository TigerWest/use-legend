import { observable, type Observable } from "@legendapp/state";
import type { Pausable } from "../../types";
import { createRafFn } from "@timer/useRafFn/core";
import { createIntervalFn } from "@timer/useIntervalFn/core";

export interface NowOptions {
  /**
   * Update interval — determines scheduler type.
   * - 'requestAnimationFrame': rAF-based (default, smoother)
   * - number: ms-based setInterval (battery friendly)
   * @default 'requestAnimationFrame'
   */
  interval?: "requestAnimationFrame" | number;
  /** If true, starts immediately. @default true */
  immediate?: boolean;
}

/**
 * Core observable function for reactive current Date.
 * Unlike the hook version, conditionally creates only the needed scheduler
 * (no need to satisfy React rules-of-hooks).
 */
export function createNow(options?: NowOptions): Pausable & { now$: Observable<Date> } {
  const interval = options?.interval ?? "requestAnimationFrame";
  const isRaf = interval === "requestAnimationFrame";
  const immediate = options?.immediate ?? true;

  const now$ = observable<Date>(new Date());
  const update = () => now$.set(new Date());

  const scheduler = isRaf
    ? createRafFn(update, { immediate })
    : createIntervalFn(update, observable(typeof interval === "number" ? interval : 1000), {
        immediate,
      });

  return { now$, ...scheduler };
}
