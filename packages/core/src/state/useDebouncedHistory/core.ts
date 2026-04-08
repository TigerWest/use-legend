import { type Observable } from "@legendapp/state";
import { observable } from "@shared/observable";
import type { DeepMaybeObservable } from "../../types";
import { debounceFilter } from "@shared/filters";
import {
  createDataHistory,
  type DataHistoryOptions,
  type DataHistoryReturn,
} from "../useDataHistory/core";

export interface DebouncedHistoryOptions<Raw, Serialized = Raw> extends Omit<
  DataHistoryOptions<Raw, Serialized>,
  "eventFilter"
> {
  /**
   * Debounce delay in milliseconds.
   * @default 200
   */
  debounce?: number;
  /**
   * Maximum time to wait before forcing a commit, regardless of activity.
   */
  maxWait?: number;
}

/**
 * Core observable function for debounced undo/redo history.
 * No React dependency — can be used in any JavaScript environment.
 *
 * @param source$ - The Observable to track.
 * @param options - Debounce timing and history configuration.
 */
export function createDebouncedHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: DeepMaybeObservable<DebouncedHistoryOptions<Raw, Serialized>>
): DataHistoryReturn<Raw, Serialized> {
  const opts$ = observable(options);

  // Reactive delay — re-evaluates when opts$.debounce changes
  const delay$ = observable(() => opts$.get()?.debounce ?? 200);

  const rawOpts = opts$.peek();
  const filter = debounceFilter(delay$, { maxWait: opts$.maxWait });

  return createDataHistory(source$, { ...rawOpts, eventFilter: filter });
}
