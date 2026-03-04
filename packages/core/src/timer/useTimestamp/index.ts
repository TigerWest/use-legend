"use client";
import { useObservable } from "@legendapp/state/react";
import type { DeepMaybeObservable, Pausable, ReadonlyObservable } from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { usePeekInitial } from "@reactivity/usePeekInitial";
import { useRafFn } from "@timer/useRafFn";
import { useIntervalFn } from "@timer/useIntervalFn";

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
  // ✅ 'function' hint: prevent Legend-State from wrapping callback as child Observable
  const opts$ = useMaybeObservable(options, {
    callback: "function",
  });

  // ✅ mount-time-only: usePeekInitial — stable across re-renders
  const exposeControls = usePeekInitial(opts$.controls, false);
  const interval = usePeekInitial(opts$.interval, "requestAnimationFrame" as const);

  const ts$ = useObservable<number>(new Date().getTime() + (opts$.offset.peek() ?? 0));

  const update = () => {
    // ✅ reactive field: .get() inside loop — offset changes reflected immediately
    const value = Date.now() + (opts$.offset.get() ?? 0);
    ts$.set(value);
    // ✅ function hint field: opts$.peek()?.callback pattern
    opts$.peek()?.callback?.(value);
  };

  // Always call both hooks unconditionally (react-hooks/rules-of-hooks)
  // Scheduler selection is fixed at mount — only the chosen one starts via `immediate`
  const isRaf = interval === "requestAnimationFrame";
  const intervalMs: number = typeof interval === "number" ? interval : 1000;
  const rafControls = useRafFn(update, { immediate: isRaf });
  const intervalControls = useIntervalFn(update, intervalMs, { immediate: !isRaf });
  const controls: Pausable = isRaf ? rafControls : intervalControls;

  if (exposeControls) {
    return { timestamp$: ts$ as ReadonlyObservable<number>, ...controls };
  }
  return ts$ as ReadonlyObservable<number>;
}
