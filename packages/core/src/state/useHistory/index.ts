"use client";

import { type Observable, batch as legendBatch } from "@legendapp/state";
import { useObserve } from "@legendapp/state/react";
import { useRef } from "react";
import type { DeepMaybeObservable, Fn, ReadonlyObservable } from "../../types";
import type { EventFilter } from "@shared/filters";
import { pausableFilter } from "@shared/filters";
import { noop } from "@shared/utils";
import { useMaybeObservable } from "../../reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import {
  useManualHistory,
  type UseManualHistoryOptions,
  type UseManualHistoryReturn,
} from "../useManualHistory";

export interface UseHistoryOptions<Raw, Serialized = Raw> extends UseManualHistoryOptions<
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

export interface UseHistoryReturn<Raw, Serialized = Raw> extends UseManualHistoryReturn<
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
  /** Stop auto-tracking permanently. */
  dispose: Fn;
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
 * const { undo, redo, canUndo$, pause, resume } = useHistory(text$);
 *
 * text$.set('world');  // auto-committed
 * undo();              // text$ → 'hello'
 * ```
 */
export function useHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: DeepMaybeObservable<UseHistoryOptions<Raw, Serialized>>
): UseHistoryReturn<Raw, Serialized> {
  const opts$ = useMaybeObservable(options, {
    dump: "function",
    parse: "function",
    shouldCommit: "function",
  });

  // Mount-time-only options
  const mountConfig = useConstant(() => {
    const raw = opts$.peek();
    return {
      eventFilter: raw?.eventFilter as EventFilter | undefined,
    };
  });

  // Delegate stack management to useManualHistory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- UseHistoryOptions extends UseManualHistoryOptions; extra fields are safely ignored
  const manual = useManualHistory<Raw, Serialized>(source$, options as any);

  // Pausable filter — composes with optional eventFilter (throttle/debounce)
  const pausable = useConstant(() => pausableFilter(mountConfig.eventFilter));

  // Flag to prevent circular auto-commit during undo/redo/transaction
  const isRestoringRef = useRef(false);
  // Flag to track if disposed
  const isDisposedRef = useRef(false);
  // Skip the initial observe pass: useManualHistory already seeded the first snapshot.
  const hasObservedInitialRef = useRef(false);

  // Auto-commit on source$ change
  useObserve(() => {
    const value = source$.get(); // register reactive dependency

    if (!hasObservedInitialRef.current) {
      hasObservedInitialRef.current = true;
      return;
    }

    if (isRestoringRef.current || isDisposedRef.current) return;

    pausable.eventFilter(
      () => {
        const shouldCommit = opts$.peek()?.shouldCommit as ((v: Raw) => boolean) | undefined;
        if (shouldCommit && !shouldCommit(value)) return;
        manual.commit();
      },
      { fn: noop, args: [], thisArg: undefined }
    );
  });

  // Wrapped undo/redo — set isRestoring to prevent auto-commit
  const undo = () => {
    isRestoringRef.current = true;
    manual.undo();
    isRestoringRef.current = false;
  };

  const redo = () => {
    isRestoringRef.current = true;
    manual.redo();
    isRestoringRef.current = false;
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
    isRestoringRef.current = true;
    legendBatch(() => {
      fn(() => {
        canceled = true;
      });
    });
    isRestoringRef.current = false;
    if (!canceled) manual.commit();
  };

  const dispose = () => {
    isDisposedRef.current = true;
    pausable.pause();
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
