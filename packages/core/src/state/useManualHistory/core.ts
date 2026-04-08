import { type Observable, ObservableHint, observable } from "@legendapp/state";
import type { DeepMaybeObservable, Fn, ReadonlyObservable, UseHistoryRecord } from "../../types";

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

export interface ManualHistoryReturn<Raw, Serialized = Raw> {
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
  options?: DeepMaybeObservable<ManualHistoryOptions<Raw, Serialized>>
): ManualHistoryReturn<Raw, Serialized> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Observable<Raw>.set() type workaround
  const src = source$ as any as { set: (v: Raw) => void; peek: () => Raw };

  // observable(options) auto-derefs all DeepMaybeObservable forms at runtime
  const opts$ = observable(options) as unknown as Observable<
    ManualHistoryOptions<Raw, Serialized> | undefined
  >;

  // serializer$ — opaque to prevent Legend-State from JSON-serializing function values.
  // Uses peek() internally (no reactive tracking) — strategy is fixed at construction time,
  // but function refs are always read fresh via opts$.peek() on every serialize/deserialize call.
  // serializer$ — opts$.get() tracks parent-level changes (avoids JSON error from function child observables).
  // ObservableHint.opaque() prevents Legend-State from JSON-comparing the returned function object.
  const serializer$ = observable(() => {
    const { dump, parse, clone: cloneOpt } = opts$.get() ?? {};
    if (dump && parse) {
      return ObservableHint.opaque({
        serialize: (v: Raw): Serialized => dump(v),
        deserialize: (v: Serialized): Raw => parse(v),
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- internal clone bridging Raw ↔ Serialized
    const cloneFn: (v: any) => any =
      typeof cloneOpt === "function"
        ? cloneOpt
        : cloneOpt === false
          ? (v: unknown) => v
          : (v: unknown) => structuredClone(v);
    return ObservableHint.opaque({
      serialize: cloneFn as (v: Raw) => Serialized,
      deserialize: cloneFn as (v: Serialized) => Raw,
    });
  });

  const initialRecord: UseHistoryRecord<Serialized> = {
    snapshot: serializer$.peek().serialize(src.peek()),
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
    const { serialize } = serializer$.peek();
    const capacity = opts$.peek()?.capacity;
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
    const { deserialize } = serializer$.peek();
    const [top, ...rest] = undoStack;
    redoStack = [last, ...redoStack];
    last = top;
    undoStack = rest;
    src.set(deserialize(last.snapshot));
    bump();
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const { deserialize } = serializer$.peek();
    const [top, ...rest] = redoStack;
    undoStack = [last, ...undoStack];
    last = top;
    redoStack = rest;
    src.set(deserialize(last.snapshot));
    bump();
  };

  const clear = () => {
    const { serialize } = serializer$.peek();
    undoStack = [];
    redoStack = [];
    last = {
      snapshot: serialize(src.peek()),
      timestamp: Date.now(),
    };
    bump();
  };

  const reset = () => {
    const { deserialize } = serializer$.peek();
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
  };
}
