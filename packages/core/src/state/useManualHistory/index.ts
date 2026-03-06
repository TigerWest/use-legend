"use client";

import { type Observable } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useRef } from "react";
import type { DeepMaybeObservable, Fn, ReadonlyObservable, UseHistoryRecord } from "../../types";
import { useMaybeObservable } from "../../reactivity/useMaybeObservable";
import { useConstant } from "@shared/useConstant";

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

  // Observable<Raw>.set() exists at runtime but TypeScript's conditional type
  // resolution for generic Raw doesn't surface it. Cast once for internal use.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = source$ as any as { set: (v: Raw) => void; peek: () => Raw };

  // Mount-time config — all options are fixed at mount
  const config = useConstant(() => {
    const raw = opts$.peek();
    const capacity = raw?.capacity;
    const dumpOpt = raw?.dump;
    const parseOpt = raw?.parse;
    const cloneOpt = raw?.clone;

    if (dumpOpt && parseOpt) {
      return { serialize: dumpOpt, deserialize: parseOpt, capacity };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- internal clone bridging Raw ↔ Serialized
    const cloneFn: (v: any) => any =
      typeof cloneOpt === "function"
        ? cloneOpt
        : cloneOpt === false
          ? (v: unknown) => v
          : (v: unknown) => structuredClone(v);

    return {
      serialize: cloneFn as (v: Raw) => Serialized,
      deserialize: cloneFn as (v: Serialized) => Raw,
      capacity,
    };
  });

  const initialRecord = useConstant<UseHistoryRecord<Serialized>>(() => ({
    snapshot: config.serialize(src.peek()),
    timestamp: Date.now(),
  }));

  // Internal mutable state — stacks are newest-first
  const undoStackRef = useRef<UseHistoryRecord<Serialized>[]>([]);
  const redoStackRef = useRef<UseHistoryRecord<Serialized>[]>([]);
  const lastRef = useRef(initialRecord);

  // Version counter — bumping triggers reactive state re-evaluation
  const version$ = useObservable(0);
  const bump = () => version$.set((v) => v + 1);

  // Derived reactive state (computed via version$ dependency).
  // Explicit type params + deps array required for Legend-State to treat as computed.
  const canUndo$ = useObservable<boolean>(() => {
    version$.get();
    return undoStackRef.current.length > 0;
  }, []) as unknown as ReadonlyObservable<boolean>;

  const canRedo$ = useObservable<boolean>(() => {
    version$.get();
    return redoStackRef.current.length > 0;
  }, []) as unknown as ReadonlyObservable<boolean>;

  const last$ = useObservable<UseHistoryRecord<Serialized>>(() => {
    version$.get();
    return lastRef.current;
  }, []) as unknown as ReadonlyObservable<UseHistoryRecord<Serialized>>;

  const history$ = useObservable<UseHistoryRecord<Serialized>[]>(() => {
    version$.get();
    return [lastRef.current, ...undoStackRef.current];
  }, []) as unknown as ReadonlyObservable<UseHistoryRecord<Serialized>[]>;

  // --- Actions ---

  const commit = () => {
    undoStackRef.current = [lastRef.current, ...undoStackRef.current];
    if (config.capacity && undoStackRef.current.length > config.capacity) {
      undoStackRef.current = undoStackRef.current.slice(0, config.capacity);
    }
    lastRef.current = {
      snapshot: config.serialize(src.peek()),
      timestamp: Date.now(),
    };
    redoStackRef.current = [];
    bump();
  };

  const undo = () => {
    if (undoStackRef.current.length === 0) return;
    const [top, ...rest] = undoStackRef.current;
    redoStackRef.current = [lastRef.current, ...redoStackRef.current];
    lastRef.current = top;
    undoStackRef.current = rest;
    src.set(config.deserialize(lastRef.current.snapshot));
    bump();
  };

  const redo = () => {
    if (redoStackRef.current.length === 0) return;
    const [top, ...rest] = redoStackRef.current;
    undoStackRef.current = [lastRef.current, ...undoStackRef.current];
    lastRef.current = top;
    redoStackRef.current = rest;
    src.set(config.deserialize(lastRef.current.snapshot));
    bump();
  };

  const clear = () => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    lastRef.current = {
      snapshot: config.serialize(src.peek()),
      timestamp: Date.now(),
    };
    bump();
  };

  const reset = () => {
    src.set(config.deserialize(lastRef.current.snapshot));
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
