import { type Observable, isObservable } from "@legendapp/state";
import { observable } from "@shared/observable";
import { throttleFilter } from "@shared/filters";
import type { DeepMaybeObservable, MaybeObservable } from "../../types";
import {
  createDataHistory,
  type DataHistoryOptions,
  type DataHistoryReturn,
} from "../useDataHistory/core";

export interface ThrottledHistoryOptions<Raw, Serialized = Raw> extends Omit<
  DataHistoryOptions<Raw, Serialized>,
  "eventFilter"
> {
  /**
   * Throttle interval in milliseconds.
   * @default 200
   */
  throttle?: MaybeObservable<number>;
  /**
   * Fire on the trailing edge of the throttle window.
   * @default true
   */
  trailing?: boolean;
  /**
   * Fire on the leading edge of the throttle window.
   * @default true
   */
  leading?: boolean;
}

/**
 * Core observable function for throttled undo/redo history.
 * No React dependency — can be used in any JavaScript environment.
 *
 * @param source$ - The Observable to track.
 * @param options - Throttle timing and history configuration.
 */
export function createThrottledHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: DeepMaybeObservable<ThrottledHistoryOptions<Raw, Serialized>>
): DataHistoryReturn<Raw, Serialized> {
  const rawOpts = (isObservable(options) ? options.peek() : options) as
    | ThrottledHistoryOptions<Raw, Serialized>
    | undefined;

  // trailing/leading are mount-time-only — cannot switch scheduler type after mount
  const { trailing = true, leading = true } = rawOpts ?? {};
  const edges: Array<"leading" | "trailing"> = [];
  if (leading) edges.push("leading");
  if (trailing) edges.push("trailing");

  const opts$ = observable(options);

  // Reactive interval — re-evaluates when opts$.throttle changes
  const interval$ = observable(() => (opts$.get()?.throttle as number | undefined) ?? 200);

  const filter = throttleFilter(interval$, { edges });

  return createDataHistory(source$, { ...rawOpts, eventFilter: filter });
}
