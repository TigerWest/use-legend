"use client";
import { useObservable } from "@legendapp/state/react";
import { useRef } from "react";
import type {
  DeepMaybeObservable,
  Fn,
  MaybeObservable,
  Pausable,
  ReadonlyObservable,
} from "../../types";
import { useMaybeObservable } from "../../reactivity/useMaybeObservable";
import { usePeekInitial } from "../../reactivity/usePeekInitial";
import { useIntervalFn } from "../useIntervalFn";
import { get } from "../../utilities/get";
import { peek } from "../../utilities/peek";

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
  const interval = usePeekInitial(opts$.interval, 1000);
  const immediate = usePeekInitial(opts$.immediate, true);

  const remaining$ = useObservable<number>(Math.max(0, get(initialCount)));
  const pauseRef = useRef<Fn | null>(null);

  const update = () => {
    const prev = remaining$.peek();
    const next = Math.max(0, prev - 1);
    remaining$.set(next);
    opts$.peek()?.onTick?.(next);
    if (next <= 0) {
      pauseRef.current?.();
      (opts$.peek()?.onComplete as (() => void) | undefined)?.();
    }
  };

  const controls = useIntervalFn(update, interval, {
    immediate: immediate && peek(initialCount) > 0,
  });
  // eslint-disable-next-line react-hooks/refs -- intentional: storing pause in ref to break circular dependency with update()
  pauseRef.current = controls.pause;

  const resume = () => {
    if (remaining$.peek() <= 0) return;
    controls.resume();
  };

  const reset = (count?: number) => {
    remaining$.set(Math.max(0, count ?? get(initialCount)));
  };

  const stop = () => {
    controls.pause();
    reset();
  };

  const start = (count?: number) => {
    reset(count);
    resume();
  };

  return {
    remaining$,
    isActive$: controls.isActive$,
    pause: controls.pause,
    resume,
    reset,
    stop,
    start,
  };
}
