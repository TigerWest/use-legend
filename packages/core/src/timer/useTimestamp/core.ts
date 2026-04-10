import { observable, type Observable } from "@legendapp/state";
import type { DeepMaybeObservable, Pausable } from "../../types";
import { createRafFn } from "@timer/useRafFn/core";
import { createIntervalFn } from "@timer/useIntervalFn/core";

export interface TimestampOptions {
  /** Expose pause/resume controls — mount-time-only */
  controls?: boolean;
  /**
   * Offset (ms) added to the timestamp on every tick — reactive
   * @default 0
   */
  offset?: number;
  /**
   * Update interval — determines scheduler type.
   * - 'requestAnimationFrame': rAF-based (default, smoother)
   * - number: ms-based setInterval (battery friendly)
   * @default 'requestAnimationFrame'
   */
  interval?: "requestAnimationFrame" | number;
  /** Callback invoked on every update */
  callback?: (timestamp: number) => void;
}

export function createTimestamp(
  options?: DeepMaybeObservable<TimestampOptions & { controls?: false }>
): Observable<number>;
export function createTimestamp(
  options: DeepMaybeObservable<TimestampOptions & { controls: true }>
): Pausable & { timestamp$: Observable<number> };
export function createTimestamp(
  options?: DeepMaybeObservable<TimestampOptions>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const opts$ = observable(options);

  const exposeControls = opts$.peek()?.controls ?? false;
  const interval = opts$.peek()?.interval ?? "requestAnimationFrame";
  const isRaf = interval === "requestAnimationFrame";

  const ts$ = observable<number>(Date.now() + (opts$.peek()?.offset ?? 0));

  const update = () => {
    const opts = opts$.get() ?? {};
    const value = Date.now() + (opts.offset ?? 0);
    ts$.set(value);
    opts.callback?.(value);
  };

  const scheduler = isRaf
    ? createRafFn(update)
    : createIntervalFn(update, observable(typeof interval === "number" ? interval : 1000));

  if (exposeControls) {
    return { timestamp$: ts$, ...scheduler };
  }
  return ts$;
}
