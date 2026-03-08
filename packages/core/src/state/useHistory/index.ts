"use client";

import { type Observable } from "@legendapp/state";
import type { DeepMaybeObservable, Fn, ReadonlyObservable } from "../../types";
import type { EventFilter } from "@shared/filters";
import { useMaybeObservable } from "../../reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { createHistory } from "./core";
import type { UseManualHistoryOptions, UseManualHistoryReturn } from "../useManualHistory";
import { useUnmount } from "@legendapp/state/react";

export { createHistory, type HistoryOptions, type HistoryReturn } from "./core";

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

  // 1. core 함수 1회 호출 (useConstant — 리렌더에도 재생성 안 됨)
  const result = useConstant(() => createHistory<Raw, Serialized>(source$, opts$.peek()));

  // 2. unmount 시 cleanup
  useUnmount(result.dispose);

  return result;
}
