"use client";
import type { Observable } from "@legendapp/state";
import { useMount } from "@legendapp/state/react";
import type { DeepMaybeObservable, Pausable, ReadonlyObservable } from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { usePeekInitial } from "@reactivity/usePeekInitial";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { createTimestamp } from "./core";

export { createTimestamp } from "./core";
export type { TimestampOptions } from "./core";

export interface UseTimestampOptions<Controls extends boolean = false> {
  controls?: Controls;
  /**
   * Offset (ms) added to the timestamp on every tick — reactive (applied each tick)
   * @default 0
   */
  offset?: number;
  /** Update interval — mount-time-only (determines scheduler type) */
  interval?: "requestAnimationFrame" | number;
  /** Callback invoked on every update — function hint */
  callback?: (timestamp: number) => void;
}

export function useTimestamp(options?: UseTimestampOptions<false>): ReadonlyObservable<number>;
export function useTimestamp(
  options: UseTimestampOptions<true>
): { timestamp$: ReadonlyObservable<number> } & Pausable;
export function useTimestamp(
  options?: DeepMaybeObservable<UseTimestampOptions<boolean>>
): ReadonlyObservable<number> | ({ timestamp$: ReadonlyObservable<number> } & Pausable) {
  const opts$ = useMaybeObservable(options, { callback: "function" });

  const exposeControls = usePeekInitial(opts$.controls, false);
  const interval = usePeekInitial(opts$.interval, "requestAnimationFrame" as const);
  const callbackRef = useLatest(opts$.peek()?.callback);

  const result = useConstant(() =>
    createTimestamp(opts$.offset as unknown as Observable<number>, {
      interval,
      immediate: false,
      callback: (v) => (callbackRef.current as ((t: number) => void) | undefined)?.(v),
    })
  );

  useMount(() => {
    result.resume();
    return () => result.dispose();
  });

  if (exposeControls) {
    return {
      timestamp$: result.timestamp$ as ReadonlyObservable<number>,
      isActive$: result.isActive$,
      pause: result.pause,
      resume: result.resume,
    };
  }
  return result.timestamp$ as ReadonlyObservable<number>;
}
