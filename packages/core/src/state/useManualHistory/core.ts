import { type Observable, observable } from "@legendapp/state";
import type { Disposable, Fn, ReadonlyObservable, UseHistoryRecord } from "../../types";

export interface ManualHistoryOptions<Raw, Serialized = Raw> {
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

export interface ManualHistoryReturn<Raw, Serialized = Raw> extends Disposable {
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
 * Core observable function for manually managing undo/redo history.
 * No React dependency — can be used in any JavaScript environment.
 *
 * @param source$ - The Observable to track.
 * @param options - Configuration for capacity, cloning, and serialization.
 */
export function createManualHistory<Raw, Serialized = Raw>(
  source$: Observable<Raw>,
  options?: ManualHistoryOptions<Raw, Serialized>
): ManualHistoryReturn<Raw, Serialized> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Observable<Raw>.set() type workaround
  const src = source$ as any as { set: (v: Raw) => void; peek: () => Raw };

  const capacity = options?.capacity;
  const dumpOpt = options?.dump;
  const parseOpt = options?.parse;
  const cloneOpt = options?.clone;

  let serialize: (v: Raw) => Serialized;
  let deserialize: (v: Serialized) => Raw;

  if (dumpOpt && parseOpt) {
    serialize = dumpOpt;
    deserialize = parseOpt;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- internal clone bridging Raw ↔ Serialized
    const cloneFn: (v: any) => any =
      typeof cloneOpt === "function"
        ? cloneOpt
        : cloneOpt === false
          ? (v: unknown) => v
          : (v: unknown) => structuredClone(v);
    serialize = cloneFn as (v: Raw) => Serialized;
    deserialize = cloneFn as (v: Serialized) => Raw;
  }

  const initialRecord: UseHistoryRecord<Serialized> = {
    snapshot: serialize(src.peek()),
    timestamp: Date.now(),
  };

  // Internal mutable state — stacks are newest-first
  let undoStack: UseHistoryRecord<Serialized>[] = [];
  let redoStack: UseHistoryRecord<Serialized>[] = [];
  let last: UseHistoryRecord<Serialized> = initialRecord;

  // Version counter — bumping triggers reactive state re-evaluation
  const version$ = observable(0);
  const bump = () => version$.set((v) => v + 1);

  // Derived reactive state (computed via version$ dependency)
  const canUndo$ = observable<boolean>(() => {
    version$.get();
    return undoStack.length > 0;
  }) as unknown as ReadonlyObservable<boolean>;

  const canRedo$ = observable<boolean>(() => {
    version$.get();
    return redoStack.length > 0;
  }) as unknown as ReadonlyObservable<boolean>;

  const last$ = observable<UseHistoryRecord<Serialized>>(() => {
    version$.get();
    return last;
  }) as unknown as ReadonlyObservable<UseHistoryRecord<Serialized>>;

  const history$ = observable<UseHistoryRecord<Serialized>[]>(() => {
    version$.get();
    return [last, ...undoStack];
  }) as unknown as ReadonlyObservable<UseHistoryRecord<Serialized>[]>;

  // --- Actions ---

  const commit = () => {
    undoStack = [last, ...undoStack];
    if (capacity && undoStack.length > capacity) {
      undoStack = undoStack.slice(0, capacity);
    }
    last = {
      snapshot: serialize(src.peek()),
      timestamp: Date.now(),
    };
    redoStack = [];
    bump();
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const [top, ...rest] = undoStack;
    redoStack = [last, ...redoStack];
    last = top;
    undoStack = rest;
    src.set(deserialize(last.snapshot));
    bump();
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const [top, ...rest] = redoStack;
    undoStack = [last, ...undoStack];
    last = top;
    redoStack = rest;
    src.set(deserialize(last.snapshot));
    bump();
  };

  const clear = () => {
    undoStack = [];
    redoStack = [];
    last = {
      snapshot: serialize(src.peek()),
      timestamp: Date.now(),
    };
    bump();
  };

  const reset = () => {
    src.set(deserialize(last.snapshot));
  };

  return {
    canUndo$,
    canRedo$,
    history$,
    last$,
    commit,
    undo,
    redo,
    clear,
    reset,
    dispose: () => {},
  };
}
