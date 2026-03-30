import { type Observable, observe, batch as legendBatch } from "@legendapp/state";
import type { Disposable, Fn, ReadonlyObservable } from "../../types";
import type { EventFilter } from "@shared/filters";
import { createPausableFilter } from "@utilities/usePausableFilter";
import { noop } from "@shared/utils";
import {
  createManualHistory,
  type ManualHistoryOptions,
  type ManualHistoryReturn,
} from "../useManualHistory/core";

export interface HistoryOptions<Raw, Serialized = Raw> extends ManualHistoryOptions<
  Raw,
  Serialized
> {
  /**
   * Custom EventFilter to control when auto-commits fire.
   * Used internally by throttledHistory / debouncedHistory.
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

export interface HistoryReturn<Raw, Serialized = Raw>
  extends Omit<ManualHistoryReturn<Raw, Serialized>, "dispose">, Disposable {
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
 * No React dependency — can be used in any JavaScript environment.
 *
 * @param source$ - The Observable to track.
 * @param options - Configuration for auto-tracking, filtering, and serialization.
 */
export function createHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: HistoryOptions<Raw, Serialized>
): HistoryReturn<Raw, Serialized> {
  // Delegate stack management to manualHistory
  const manual = createManualHistory<Raw, Serialized>(source$, options);

  // Pausable filter — composes with optional eventFilter (throttle/debounce)
  const pausable = createPausableFilter(options?.eventFilter);
  const shouldCommitFn = options?.shouldCommit;

  // Flag to prevent circular auto-commit during undo/redo/transaction
  let isRestoring = false;
  // Flag to track if disposed
  let isDisposed = false;
  // Skip the initial observe pass: manualHistory already seeded the first snapshot.
  let hasObservedInitial = false;

  // Auto-commit on source$ change
  const unsub = observe(() => {
    const value = source$.get(); // register reactive dependency

    if (!hasObservedInitial) {
      hasObservedInitial = true;
      return;
    }

    if (isRestoring || isDisposed) return;

    pausable.eventFilter(
      () => {
        if (shouldCommitFn && !shouldCommitFn(value)) return;
        manual.commit();
      },
      { fn: noop, args: [], thisArg: undefined }
    );
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

  const dispose = () => {
    isDisposed = true;
    pausable.pause();
    unsub();
    manual.dispose();
  };

  return {
    ...manual,
    undo,
    redo,
    isTracking$: pausable.isActive$,
    pause,
    resume,
    transaction,
    dispose,
  };
}
