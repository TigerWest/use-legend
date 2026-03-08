import { observable, type Observable } from "@legendapp/state";
import type { Disposable, Pausable } from "../../types";
import { createRafFn } from "@timer/useRafFn/core";
import { createIntervalFn } from "@timer/useIntervalFn/core";

export interface TimestampOptions {
  /**
   * Update interval — determines scheduler type.
   * - 'requestAnimationFrame': rAF-based (default, smoother)
   * - number: ms-based setInterval (battery friendly)
   * @default 'requestAnimationFrame'
   */
  interval?: "requestAnimationFrame" | number;
  /** If true, starts immediately. @default true */
  immediate?: boolean;
  /** Callback invoked on every update */
  callback?: (timestamp: number) => void;
}

/**
 * Core observable function for reactive timestamp.
 * No React dependency — uses rafFn/intervalFn core internally.
 * Unlike the hook version, conditionally creates only the needed scheduler.
 */
export function createTimestamp(
  offset$: Observable<number>,
  options?: TimestampOptions
): Disposable & Pausable & { timestamp$: Observable<number> } {
  const interval = options?.interval ?? "requestAnimationFrame";
  const isRaf = interval === "requestAnimationFrame";
  const immediate = options?.immediate ?? true;
  const callback = options?.callback;

  const ts$ = observable<number>(Date.now() + (offset$.peek() ?? 0));

  const update = () => {
    const value = Date.now() + (offset$.peek() ?? 0);
    ts$.set(value);
    callback?.(value);
  };

  const scheduler = isRaf
    ? createRafFn(update, { immediate })
    : createIntervalFn(update, observable(typeof interval === "number" ? interval : 1000), {
        immediate,
      });

  return { timestamp$: ts$, ...scheduler };
}
