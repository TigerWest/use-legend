"use client";
import type { Observable } from "@legendapp/state";
import { useMount } from "@legendapp/state/react";
import type {
  DeepMaybeObservable,
  MaybeObservable,
  Pausable,
  ReadonlyObservable,
} from "../../types";
import { useMaybeObservable } from "@reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { createTimeAgo } from "./core";

export { createTimeAgo, formatTimeAgo } from "./core";
export type { UseTimeAgoUnitNamesDefault, FormatTimeAgoOptions, TimeAgoOptions } from "./core";

export interface UseTimeAgoOptions<Controls extends boolean = false> {
  controls?: Controls;
  /**
   * Update interval in ms — mount-time-only
   * @default 30_000
   */
  updateInterval?: number;
  /**
   * date-fns Locale for i18n — mount-time-only
   */
  locale?: import("date-fns").Locale;
  /**
   * Max diff before fullDateFormatter is used — reactive
   */
  max?: import("./core").UseTimeAgoUnitNamesDefault | number;
  /** Formatter for dates exceeding max — function hint */
  fullDateFormatter?: (date: Date) => string;
  /**
   * Show detailed seconds for recent times (maps to date-fns `includeSeconds`).
   * When false, times within 45 s show "just now".
   * @default false
   */
  showSecond?: boolean;
}

export function useTimeAgo(
  time: MaybeObservable<Date | number | string>,
  options?: UseTimeAgoOptions<false>
): ReadonlyObservable<string>;
export function useTimeAgo(
  time: MaybeObservable<Date | number | string>,
  options: UseTimeAgoOptions<true>
): { timeAgo$: ReadonlyObservable<string> } & Pausable;
export function useTimeAgo(
  time: MaybeObservable<Date | number | string>,
  options?: DeepMaybeObservable<UseTimeAgoOptions<boolean>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const opts$ = useMaybeObservable(options, {
    fullDateFormatter: "function",
  });

  // mount-time-only
  const exposeControls = opts$.controls.peek() ?? false;
  const updateInterval = opts$.updateInterval.peek() ?? 30_000;
  const locale = opts$.locale.peek() as import("date-fns").Locale | undefined;

  const time$ = useMaybeObservable(time);

  const result = useConstant(() =>
    createTimeAgo(
      time$ as unknown as Observable<Date | number | string>,
      opts$.max as unknown as Observable<
        import("./core").UseTimeAgoUnitNamesDefault | number | undefined
      >,
      opts$.showSecond as unknown as Observable<boolean | undefined>,
      {
        updateInterval,
        locale,
        fullDateFormatter: opts$.peek()?.fullDateFormatter as ((date: Date) => string) | undefined,
        immediate: false,
      }
    )
  );

  useMount(() => {
    result.resume();
    return () => result.dispose();
  });

  if (exposeControls) {
    return {
      timeAgo$: result.timeAgo$ as ReadonlyObservable<string>,
      isActive$: result.isActive$,
      pause: result.pause,
      resume: result.resume,
    };
  }
  return result.timeAgo$ as ReadonlyObservable<string>;
}
