"use client";
import type { Observable } from "@legendapp/state";
import { useMount } from "@legendapp/state/react";
import type {
  DeepMaybeObservable,
  Fn,
  MaybeObservable,
  Pausable,
  ReadonlyObservable,
} from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { usePeekInitial } from "@reactivity/usePeekInitial";
import { useConstant } from "@shared/useConstant";
import { useLatest } from "@shared/useLatest";
import { createCountdown } from "./core";

export { createCountdown } from "./core";
export type { CountdownOptions, CountdownReturn } from "./core";

export interface UseCountdownOptions {
  /** Interval between ticks in ms — mount-time-only @default 1000 */
  interval?: number;
  /** Auto-start on mount — mount-time-only @default true */
  immediate?: boolean;
  /** Callback on each tick — function hint */
  onTick?: (remaining: number) => void;
  /** Callback when countdown reaches 0 — function hint */
  onComplete?: () => void;
}

export interface UseCountdownReturn extends Pausable {
  /** Current remaining count — read-only */
  remaining$: ReadonlyObservable<number>;
  /** Reset to initial count or custom value */
  reset: (count?: number) => void;
  /** Pause + reset (stop the countdown entirely) */
  stop: Fn;
  /** Reset to initial/custom count + resume (restart) */
  start: (count?: number) => void;
}

export function useCountdown(
  initialCount: MaybeObservable<number>,
  options?: DeepMaybeObservable<UseCountdownOptions>
): UseCountdownReturn {
  const opts$ = useMaybeObservable(options, { onTick: "function", onComplete: "function" });
  const initialCount$ = useMaybeObservable(initialCount);
  const interval = usePeekInitial(opts$.interval, 1000);
  const immediate = usePeekInitial(opts$.immediate, true);

  const onTickRef = useLatest(opts$.peek()?.onTick);
  const onCompleteRef = useLatest(opts$.peek()?.onComplete);

  const result = useConstant(() =>
    createCountdown(initialCount$ as unknown as Observable<number>, {
      interval,
      immediate: false,
      onTick: (n) => (onTickRef.current as ((n: number) => void) | undefined)?.(n),
      onComplete: () => (onCompleteRef.current as (() => void) | undefined)?.(),
    })
  );

  useMount(() => {
    if (immediate && (initialCount$ as unknown as Observable<number>).peek() > 0) {
      result.resume();
    }
    return () => result.dispose();
  });

  return {
    remaining$: result.remaining$,
    isActive$: result.isActive$,
    pause: result.pause,
    resume: result.resume,
    reset: result.reset,
    stop: result.stop,
    start: result.start,
  };
}
