"use client";

import { type Observable } from "@legendapp/state";
import type { DeepMaybeObservable, Fn, ReadonlyObservable, UseHistoryRecord } from "../../types";
import { useMaybeObservable } from "../../reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";
import { createManualHistory } from "./core";
import { useUnmount } from "@legendapp/state/react";

export { createManualHistory, type ManualHistoryOptions, type ManualHistoryReturn } from "./core";

export interface UseManualHistoryOptions<Raw, Serialized = Raw> {
  /**
   * Maximum number of undo records to keep.
   * When exceeded, the oldest records are discarded.
   * @default Infinity
   */
  capacity?: number;
  /**
   * Clone strategy for snapshots.
   * - `true` (default): uses `structuredClone`
   * - `false`: stores references (safe for primitives only)
   * - `(value) => cloned`: custom clone function
   */
  clone?: boolean | ((value: Raw) => Raw);
  /**
   * Custom serializer: Raw → Serialized for storage.
   * When provided, `clone` is ignored and `parse` must also be provided.
   */
  dump?: (value: Raw) => Serialized;
  /**
   * Custom deserializer: Serialized → Raw for restore.
   * When provided, `clone` is ignored and `dump` must also be provided.
   */
  parse?: (value: Serialized) => Raw;
}

export interface UseManualHistoryReturn<Raw, Serialized = Raw> {
  /** Whether undo is possible (undoStack is non-empty). */
  readonly canUndo$: ReadonlyObservable<boolean>;
  /** Whether redo is possible (redoStack is non-empty). */
  readonly canRedo$: ReadonlyObservable<boolean>;
  /** Full history array, newest first: `[current, previous, ...]`. */
  readonly history$: ReadonlyObservable<UseHistoryRecord<Serialized>[]>;
  /** The most recent (current) history record. */
  readonly last$: ReadonlyObservable<UseHistoryRecord<Serialized>>;
  /** Record the current source value as a new history point. Clears redo stack. */
  commit: Fn;
  /** Restore the previous committed value. */
  undo: Fn;
  /** Re-apply the next value after an undo. */
  redo: Fn;
  /** Wipe all history and create a fresh initial record from current source. */
  clear: Fn;
  /** Restore source to the last committed value without modifying stacks. */
  reset: Fn;
}

/**
 * Manually manage undo/redo history for an Observable.
 * History is only recorded when `commit()` is called explicitly.
 *
 * @param source$ - The Observable to track. Must be writable (undo/redo write back to it).
 * @param options - Configuration for capacity, cloning, and serialization.
 *
 * @example
 * ```ts
 * const counter$ = observable(0);
 * const { commit, undo, redo, canUndo$ } = useManualHistory(counter$);
 *
 * counter$.set(1);
 * commit();       // snapshot: 1
 * counter$.set(2);
 * commit();       // snapshot: 2
 * undo();         // counter$ → 1
 * redo();         // counter$ → 2
 * ```
 */
export function useManualHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: DeepMaybeObservable<UseManualHistoryOptions<Raw, Serialized>>
): UseManualHistoryReturn<Raw, Serialized> {
  const opts$ = useMaybeObservable(options, {
    dump: "function",
    parse: "function",
  });

  const { dispose, ...result } = useConstant(() =>
    createManualHistory<Raw, Serialized>(source$, opts$.peek())
  );

  useUnmount(dispose);

  return result;
}
