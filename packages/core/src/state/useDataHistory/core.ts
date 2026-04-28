import { type Observable, batch as legendBatch } from "@legendapp/state";
import { createObserve, onUnmount } from "@primitives/useScope";
import type { DeepMaybeObservable, Fn, ReadonlyObservable } from "../../types";
import { observable } from "@shared/observable";
import type { EventFilter } from "@shared/filters";
import { createPausableFilter } from "@utilities/usePausableFilter";
import { noop } from "@shared/utils";
import {
  createManualHistory,
  type ManualHistoryOptions,
  type ManualHistoryReturn,
} from "../useManualHistory/core";
import { peek } from "@utilities/peek";

export interface DataHistoryOptions<Raw, Serialized = Raw> extends ManualHistoryOptions<
  Raw,
  Serialized
> {
  /**
   * Custom EventFilter to control when auto-commits fire.
   * Used internally by throttledHistory / debouncedHistory.
   */
  eventFilter?: EventFilter;
  /**
   * Gate function called before each auto-commit.
   * Return `false` to skip recording the current value.
   */
  shouldCommit?: (newValue: Raw) => boolean;
}

export interface DataHistoryReturn<Raw, Serialized = Raw> extends ManualHistoryReturn<
  Raw,
  Serialized
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
 * Core observable function for auto-tracking undo/redo history.
 * No React dependency — must be called within a useScope factory.
 *
 * @param source$ - The Observable to track.
 * @param options - Configuration for auto-tracking, filtering, and serialization.
 */
export function createDataHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: DeepMaybeObservable<DataHistoryOptions<Raw, Serialized>>
): DataHistoryReturn<Raw, Serialized> {
  // Construction-time only — capacity, clone, dump, parse, eventFilter are structurally immutable
  const rawOpts = peek(options);

  // Delegate stack management to manualHistory
  const manual = createManualHistory<Raw, Serialized>(source$, rawOpts);

  // Pausable filter — composes with optional eventFilter (throttle/debounce)
  const pausable = createPausableFilter(peek(rawOpts?.eventFilter));

  // shouldCommit is called inside observe() on every source change — needs reactive access
  const opts$ = observable(options);

  // Flag to prevent circular auto-commit during undo/redo/transaction
  let isRestoring = false;
  // Skip the initial observe pass: manualHistory already seeded the first snapshot.
  let hasObservedInitial = false;

  // Auto-commit on source$ change — auto-registered to current scope
  createObserve(() => {
    const value = source$.get(); // register reactive dependency

    if (!hasObservedInitial) {
      hasObservedInitial = true;
      return;
    }

    if (isRestoring) return;

    pausable.eventFilter(
      () => {
        const shouldCommit = opts$.peek()?.shouldCommit; // latest ref, no tracking needed here
        if (shouldCommit && !shouldCommit(value)) return;
        manual.commit();
      },
      { fn: noop, args: [], thisArg: undefined }
    );
  });

  // Cleanup registered to scope — no dispose() needed
  onUnmount(() => {
    pausable.pause();
  });

  // Wrapped undo/redo — set isRestoring to prevent auto-commit
  const undo = () => {
    isRestoring = true;
    manual.undo();
    isRestoring = false;
  };

  const redo = () => {
    isRestoring = true;
    manual.redo();
    isRestoring = false;
  };

  const pause = () => {
    pausable.pause();
  };

  const resume = (commitCurrent?: boolean) => {
    pausable.resume();
    if (commitCurrent) manual.commit();
  };

  const transaction = (fn: (cancel: Fn) => void) => {
    let canceled = false;
    isRestoring = true;
    legendBatch(() => {
      fn(() => {
        canceled = true;
      });
    });
    isRestoring = false;
    if (!canceled) manual.commit();
  };

  const { ...manualRest } = manual;

  return {
    ...manualRest,
    undo,
    redo,
    isTracking$: pausable.isActive$,
    pause,
    resume,
    transaction,
  };
}
