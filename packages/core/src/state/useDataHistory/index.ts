"use client";

import { isObservable, type Observable } from "@legendapp/state";
import type { DeepMaybeObservable, Fn, ReadonlyObservable } from "../../types";
import type { EventFilter } from "@shared/filters";
import { useScope } from "@primitives/useScope";
import { createDataHistory } from "./core";
import type { UseManualHistoryOptions, UseManualHistoryReturn } from "../useManualHistory";

export { createDataHistory, type DataHistoryOptions, type DataHistoryReturn } from "./core";

export interface UseDataHistoryOptions<Raw, Serialized = Raw> extends UseManualHistoryOptions<
  Raw,
  Serialized
> {
  /**
   * Custom EventFilter to control when auto-commits fire.
   * Used internally by useThrottledHistory / useDebouncedHistory.
   */
  eventFilter?: EventFilter;
  /**
   * Watch nested changes on the source Observable.
   * In Legend-State, `source$.get()` already tracks the full tree,
   * so this option has no behavioral difference — included for VueUse API parity.
   * @default false
   */
  deep?: boolean;
  /**
   * Gate function called before each auto-commit.
   * Return `false` to skip recording the current value.
   */
  shouldCommit?: (newValue: Raw) => boolean;
}

export interface UseDataHistoryReturn<Raw, Serialized = Raw> extends Omit<
  UseManualHistoryReturn<Raw, Serialized>,
  "dispose"
> {
  /** Whether auto-tracking is currently active. */
  readonly isTracking$: ReadonlyObservable<boolean>;
  /** Stop auto-committing. */
  pause: Fn;
  /** Restart auto-committing. If `commitCurrent` is true, immediately commit current value. */
  resume: (commitCurrent?: boolean) => void;
  /** Group multiple mutations into a single history record. Call `cancel()` inside `fn` to abort. */
  transaction: (fn: (cancel: Fn) => void) => void;
}

/**
 * Automatically track undo/redo history for an Observable.
 * Extends `useManualHistory` with auto-commit on source change, pause/resume, and transaction.
 *
 * @param source$ - The Observable to track.
 * @param options - Configuration for auto-tracking, filtering, and serialization.
 *
 * @example
 * ```ts
 * const text$ = observable('hello');
 * const { undo, redo, canUndo$, pause, resume } = useDataHistory(text$);
 *
 * text$.set('world');  // auto-committed
 * undo();              // text$ → 'hello'
 * ```
 */
export function useDataHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: DeepMaybeObservable<UseDataHistoryOptions<Raw, Serialized>>
): UseDataHistoryReturn<Raw, Serialized> {
  const rawOpts = isObservable(options) ? options.peek() : options;

  return useScope(() => {
    return createDataHistory<Raw, Serialized>(source$, rawOpts);
  });
}
