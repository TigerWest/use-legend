"use client";
import { useObservable, useObserve } from "@legendapp/state/react";
import { formatDistance } from "date-fns";
import type { Locale } from "date-fns";
import type {
  DeepMaybeObservable,
  MaybeObservable,
  Pausable,
  ReadonlyObservable,
} from "../../types";
import { useMaybeObservable } from "../../function/useMaybeObservable";
import { get } from "../../function/get";
import { useNow } from "../useNow";

export type UseTimeAgoUnitNamesDefault =
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

/** ms threshold for each unit name — used by the `max` option */
const UNIT_MAX_MS: Record<UseTimeAgoUnitNamesDefault, number> = {
  second: 60_000,
  minute: 2_760_000,
  hour: 72_000_000,
  day: 518_400_000,
  week: 2_419_200_000,
  month: 28_512_000_000,
  year: Infinity,
};

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
  locale?: Locale;
  /**
   * Max diff before fullDateFormatter is used — reactive
   */
  max?: UseTimeAgoUnitNamesDefault | number;
  /** Formatter for dates exceeding max — function hint */
  fullDateFormatter?: (date: Date) => string;
  /**
   * Show detailed seconds for recent times (maps to date-fns `includeSeconds`).
   * When false, times within 45 s show "just now".
   * @default false
   */
  showSecond?: boolean;
}

export interface FormatTimeAgoOptions {
  locale?: Locale;
  max?: UseTimeAgoUnitNamesDefault | number;
  fullDateFormatter?: (date: Date) => string;
  showSecond?: boolean;
}

const JUST_NOW_MS = 45_000;

/** Pure function — no Observables, independently testable */
export function formatTimeAgo(
  from: Date,
  options: FormatTimeAgoOptions = {},
  now: Date | number = Date.now()
): string {
  const {
    max,
    fullDateFormatter = (d) => d.toISOString().slice(0, 10),
    showSecond = false,
    locale,
  } = options;

  const nowDate = new Date(now);
  const absDiff = Math.abs(+nowDate - +from);

  if (max !== undefined) {
    const maxMs = typeof max === "number" ? max : (UNIT_MAX_MS[max] ?? Infinity);
    if (absDiff > maxMs) return fullDateFormatter(from);
  }

  if (!showSecond && absDiff < JUST_NOW_MS) {
    return "just now";
  }

  return formatDistance(from, nowDate, {
    addSuffix: true,
    includeSeconds: showSecond,
    locale,
  });
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
  const locale = opts$.locale.peek() as Locale | undefined;

  const { now$, ...controls } = useNow({ controls: true, interval: updateInterval });

  const timeAgo$ = useObservable<string>("");

  useObserve(() => {
    const currentNow = now$.get();
    const target = get(time);

    // reactive fields
    const max = opts$.max.get();
    const showSecond = opts$.showSecond.get() ?? false;
    const fullDateFormatter = opts$.peek()?.fullDateFormatter;

    timeAgo$.set(
      formatTimeAgo(
        new Date(target as Date | number | string),
        { max, locale, fullDateFormatter, showSecond },
        currentNow
      )
    );
  });

  if (exposeControls) {
    return { timeAgo$: timeAgo$ as ReadonlyObservable<string>, ...controls };
  }
  return timeAgo$ as ReadonlyObservable<string>;
}
