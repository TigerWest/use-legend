import { type Observable } from "@legendapp/state";
import { throttleFilter } from "@shared/filters";
import { createHistory, type HistoryOptions, type HistoryReturn } from "../useHistory/core";

export interface ThrottledHistoryOptions<Raw, Serialized = Raw> extends Omit<
  HistoryOptions<Raw, Serialized>,
  "eventFilter"
> {
  /**
   * Controls which edges trigger the throttled invocation.
   * @default ["leading", "trailing"]
   */
  edges?: Array<"leading" | "trailing">;
}

/**
 * Core observable function for throttled undo/redo history.
 * No React dependency — can be used in any JavaScript environment.
 *
 * @param source$ - The Observable to track.
 * @param interval$ - Throttle interval in milliseconds (reactive).
 * @param options - History configuration and edge control.
 */
export function createThrottledHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  interval$: Observable<number>,
  options?: ThrottledHistoryOptions<Raw, Serialized>
): HistoryReturn<Raw, Serialized> {
  const filter = throttleFilter(interval$, {
    edges: options?.edges,
  });

  return createHistory(source$, { ...options, eventFilter: filter });
}
