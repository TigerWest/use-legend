import { observable, observe, type Observable } from "@legendapp/state";
import { formatDistance } from "date-fns";
import type { Locale } from "date-fns";
import type { Disposable, Pausable } from "../../types";
import { createNow } from "@timer/useNow/core";

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

export interface TimeAgoOptions {
  /**
   * Update interval in ms — determines scheduler type.
   * @default 30_000
   */
  updateInterval?: number;
  /** date-fns Locale for i18n */
  locale?: Locale;
  /** Formatter for dates exceeding max */
  fullDateFormatter?: (date: Date) => string;
  /** If true, starts immediately. @default true */
  immediate?: boolean;
}

/**
 * Core observable function for reactive "time ago" strings.
 * No React dependency — uses now() core internally.
 */
export function createTimeAgo(
  time$: Observable<Date | number | string>,
  max$: Observable<UseTimeAgoUnitNamesDefault | number | undefined>,
  showSecond$: Observable<boolean | undefined>,
  options?: TimeAgoOptions
): Disposable & Pausable & { timeAgo$: Observable<string> } {
  const updateInterval = options?.updateInterval ?? 30_000;
  const locale = options?.locale;
  const fullDateFormatter = options?.fullDateFormatter;
  const immediate = options?.immediate ?? true;

  const nowResult = createNow({ interval: updateInterval, immediate });
  const timeAgo$ = observable<string>("");

  const unsub = observe(() => {
    const currentNow = nowResult.now$.get();
    const target = time$.get();
    const max = max$.get();
    const showSecond = showSecond$.get() ?? false;

    timeAgo$.set(
      formatTimeAgo(
        new Date(target as Date | number | string),
        { max, locale, fullDateFormatter, showSecond },
        currentNow
      )
    );
  });

  return {
    timeAgo$,
    isActive$: nowResult.isActive$,
    pause: nowResult.pause,
    resume: nowResult.resume,
    dispose: () => {
      nowResult.dispose();
      unsub();
    },
  };
}
