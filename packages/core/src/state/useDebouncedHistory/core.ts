import { type Observable } from "@legendapp/state";
import type { MaybeObservable } from "../../types";
import { debounceFilter } from "@shared/filters";
import { history, type HistoryOptions, type HistoryReturn } from "../useHistory/core";

export interface DebouncedHistoryOptions<Raw, Serialized = Raw> extends Omit<
  HistoryOptions<Raw, Serialized>,
  "eventFilter"
> {
  /**
   * Maximum time to wait before forcing a commit, regardless of activity.
   */
  maxWait?: MaybeObservable<number | undefined>;
}

/**
 * Core observable function for debounced undo/redo history.
 * No React dependency — can be used in any JavaScript environment.
 *
 * @param source$ - The Observable to track.
 * @param delay$ - Debounce delay in milliseconds (reactive).
 * @param options - History configuration and maxWait.
 */
export function debouncedHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  delay$: Observable<number>,
  options?: DebouncedHistoryOptions<Raw, Serialized>
): HistoryReturn<Raw, Serialized> {
  const filter = debounceFilter(delay$, {
    maxWait: options?.maxWait,
  });

  return history(source$, { ...options, eventFilter: filter });
}
