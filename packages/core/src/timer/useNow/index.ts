"use client";
import { useObservable } from "@legendapp/state/react";
import type { DeepMaybeObservable, Pausable, ReadonlyObservable } from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { usePeekInitial } from "@reactivity/usePeekInitial";
import { useRafFn } from "@timer/useRafFn";
import { useIntervalFn } from "@timer/useIntervalFn";

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
  // ✅ DeepMaybeObservable → normalize
  const opts$ = useMaybeObservable(options);

  // ✅ mount-time-only: usePeekInitial — stable across re-renders
  const exposeControls = usePeekInitial(opts$.controls, false);
  const interval = usePeekInitial(opts$.interval, "requestAnimationFrame" as const);

  const now$ = useObservable<Date>(new Date());
  const update = () => now$.set(new Date());

  // Always call both hooks unconditionally (react-hooks/rules-of-hooks)
  // Scheduler selection is fixed at mount — only the chosen one starts via `immediate`
  const isRaf = interval === "requestAnimationFrame";
  const intervalMs: number = typeof interval === "number" ? interval : 1000;
  const rafControls = useRafFn(update, { immediate: isRaf });
  const intervalControls = useIntervalFn(update, intervalMs, { immediate: !isRaf });
  const controls: Pausable = isRaf ? rafControls : intervalControls;

  if (exposeControls) {
    return { now$: now$ as ReadonlyObservable<Date>, ...controls };
  }
  return now$ as ReadonlyObservable<Date>;
}
