import { observable, type Observable } from "@legendapp/state";
import { formatDistance } from "date-fns";
import type { Locale } from "date-fns";
import type { DeepMaybeObservable, MaybeObservable, Pausable } from "../../types";
import { observe, onMount } from "@primitives/useScope";
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
   * Update interval in ms — mount-time-only
   * @default 30_000
   */
  updateInterval?: number;
  /** date-fns Locale for i18n — mount-time-only */
  locale?: Locale;
  /** Max diff before fullDateFormatter is used — reactive */
  max?: UseTimeAgoUnitNamesDefault | number;
  /** Formatter for dates exceeding max — function hint */
  fullDateFormatter?: (date: Date) => string;
  /**
   * Show detailed seconds for recent times.
   * When false, times within 45s show "just now".
   * @default false
   */
  showSecond?: boolean;
  /** Expose pause/resume controls — mount-time-only */
  controls?: boolean;
}

export function createTimeAgo(
  time: MaybeObservable<Date | number | string>,
  options?: DeepMaybeObservable<TimeAgoOptions & { controls?: false }>
): Observable<string>;
export function createTimeAgo(
  time: MaybeObservable<Date | number | string>,
  options: DeepMaybeObservable<TimeAgoOptions & { controls: true }>
): Pausable & { timeAgo$: Observable<string> };
export function createTimeAgo(
  time: MaybeObservable<Date | number | string>,
  options?: DeepMaybeObservable<TimeAgoOptions>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const time$ = observable(time);
  const opts$ = observable(options);

  const exposeControls = opts$.peek()?.controls ?? false;
  const updateInterval = opts$.peek()?.updateInterval ?? 30_000;
  const locale = opts$.peek()?.locale;

  const nowResult = createNow({ interval: updateInterval, immediate: false });
  const timeAgo$ = observable<string>("");

  onMount(() => {
    nowResult.resume();
  });

  observe(() => {
    const currentNow = nowResult.now$.get();
    const target = time$.get();
    const { max, showSecond = false, fullDateFormatter } = opts$.get() ?? {};

    timeAgo$.set(
      formatTimeAgo(
        new Date(target as Date | number | string),
        { max, locale, fullDateFormatter, showSecond },
        currentNow
      )
    );
  });

  if (exposeControls) {
    return {
      timeAgo$,
      isActive$: nowResult.isActive$,
      pause: nowResult.pause,
      resume: nowResult.resume,
    };
  }
  return timeAgo$;
}
