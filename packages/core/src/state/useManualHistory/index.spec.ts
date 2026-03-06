// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect } from "vitest";
import { useManualHistory } from ".";

describe("useManualHistory()", () => {
  describe("initial state", () => {
    it("canUndo$ is false initially", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      expect(result.current.canUndo$.get()).toBe(false);
    });

    it("canRedo$ is false initially", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      expect(result.current.canRedo$.get()).toBe(false);
    });

    it("last$ contains initial snapshot of source", () => {
      const source$ = observable(42);
      const { result } = renderHook(() => useManualHistory(source$));

      expect(result.current.last$.get().snapshot).toBe(42);
    });

    it("history$ contains single initial record", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useManualHistory(source$));

      const history = result.current.history$.get();
      expect(history).toHaveLength(1);
      expect(history[0].snapshot).toBe("hello");
    });

    it("last$.timestamp is a number", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      expect(typeof result.current.last$.get().timestamp).toBe("number");
    });
  });

  describe("commit", () => {
    it("records current source value as new history point", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(10);
        result.current.commit();
      });

      expect(result.current.last$.get().snapshot).toBe(10);
    });

    it("increments canUndo$ to true after first commit", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });

      expect(result.current.canUndo$.get()).toBe(true);
    });

    it("clears redoStack on new commit after undo", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        source$.set(2);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo$.get()).toBe(true);

      act(() => {
        source$.set(99);
        result.current.commit();
      });

      expect(result.current.canRedo$.get()).toBe(false);
    });

    it("respects capacity limit", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$, { capacity: 2 }));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        source$.set(2);
        result.current.commit();
      });
      act(() => {
        source$.set(3);
        result.current.commit();
      });

      // history$ = [current(3), ...undoStack]. undoStack capped at 2.
      const history = result.current.history$.get();
      expect(history).toHaveLength(3); // current + 2 undo records
    });

    it("oldest undo record is discarded when capacity is exceeded", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$, { capacity: 1 }));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        source$.set(2);
        result.current.commit();
      });
      act(() => {
        source$.set(3);
        result.current.commit();
      });

      // undoStack capped at 1 → only one undo possible
      act(() => {
        result.current.undo();
      });
      // Should land at 2 (not 1, which was discarded)
      expect(source$.get()).toBe(2);

      expect(result.current.canUndo$.get()).toBe(false);
    });

    it("timestamps are monotonically increasing across commits", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        source$.set(2);
        result.current.commit();
      });

      const history = result.current.history$.get();
      // history[0] is newest, history[1] is older
      expect(history[0].timestamp).toBeGreaterThanOrEqual(history[1].timestamp);
    });
  });

  describe("undo", () => {
    it("restores source to previous committed value", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(5);
        result.current.commit();
      });
      act(() => {
        source$.set(10);
        result.current.commit();
      });

      act(() => {
        result.current.undo();
      });

      expect(source$.get()).toBe(5);
    });

    it("updates canUndo$ correctly after undo", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });

      expect(result.current.canUndo$.get()).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo$.get()).toBe(false);
    });

    it("updates canRedo$ to true after undo", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo$.get()).toBe(true);
    });

    it("is no-op when canUndo$ is false", () => {
      const source$ = observable(99);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        result.current.undo();
      });

      expect(source$.get()).toBe(99);
      expect(result.current.canUndo$.get()).toBe(false);
    });

    it("multiple undos traverse full history", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        source$.set(2);
        result.current.commit();
      });
      act(() => {
        source$.set(3);
        result.current.commit();
      });

      act(() => {
        result.current.undo();
      });
      expect(source$.get()).toBe(2);

      act(() => {
        result.current.undo();
      });
      expect(source$.get()).toBe(1);

      act(() => {
        result.current.undo();
      });
      expect(source$.get()).toBe(0);

      expect(result.current.canUndo$.get()).toBe(false);
    });
  });

  describe("redo", () => {
    it("restores source to next value after undo", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(5);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.redo();
      });

      expect(source$.get()).toBe(5);
    });

    it("updates canRedo$ to false after redo exhausts stack", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo$.get()).toBe(true);

      act(() => {
        result.current.redo();
      });

      expect(result.current.canRedo$.get()).toBe(false);
    });

    it("updates canUndo$ to true after redo", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.redo();
      });

      expect(result.current.canUndo$.get()).toBe(true);
    });

    it("is no-op when canRedo$ is false", () => {
      const source$ = observable(42);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        result.current.redo();
      });

      expect(source$.get()).toBe(42);
      expect(result.current.canRedo$.get()).toBe(false);
    });

    it("multiple redos traverse full redo stack", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        source$.set(2);
        result.current.commit();
      });
      act(() => {
        source$.set(3);
        result.current.commit();
      });

      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });
      expect(source$.get()).toBe(1);

      act(() => {
        result.current.redo();
      });
      expect(source$.get()).toBe(2);

      act(() => {
        result.current.redo();
      });
      expect(source$.get()).toBe(3);

      expect(result.current.canRedo$.get()).toBe(false);
    });
  });

  describe("clear", () => {
    it("resets all stacks and creates fresh initial record", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        source$.set(2);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });

      act(() => {
        source$.set(99);
        result.current.clear();
      });

      expect(result.current.history$.get()).toHaveLength(1);
      expect(result.current.last$.get().snapshot).toBe(99);
    });

    it("canUndo$ is false after clear", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        result.current.clear();
      });

      expect(result.current.canUndo$.get()).toBe(false);
    });

    it("canRedo$ is false after clear", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.clear();
      });

      expect(result.current.canRedo$.get()).toBe(false);
    });
  });

  describe("reset", () => {
    it("restores source to last committed value without modifying stacks", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(5);
        result.current.commit();
      });

      act(() => {
        source$.set(99); // uncommitted change
      });

      act(() => {
        result.current.reset();
      });

      expect(source$.get()).toBe(5);
    });

    it("does not affect canUndo$ or canRedo$ state", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        source$.set(2);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });

      const canUndoBefore = result.current.canUndo$.get();
      const canRedoBefore = result.current.canRedo$.get();

      act(() => {
        source$.set(999); // uncommitted change
        result.current.reset();
      });

      expect(result.current.canUndo$.get()).toBe(canUndoBefore);
      expect(result.current.canRedo$.get()).toBe(canRedoBefore);
    });

    it("reset on uncommitted change discards the uncommitted value", () => {
      const source$ = observable("initial");
      const { result } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set("committed");
        result.current.commit();
      });
      act(() => {
        source$.set("uncommitted");
      });

      expect(source$.get()).toBe("uncommitted");

      act(() => {
        result.current.reset();
      });

      expect(source$.get()).toBe("committed");
    });
  });

  describe("options", () => {
    it("clone: false stores references (same object reference in history)", () => {
      const obj = { x: 1 };
      const source$ = observable(obj);
      const { result } = renderHook(() => useManualHistory(source$, { clone: false }));

      const initialSnapshot = result.current.last$.get().snapshot;
      // With clone: false, snapshot is the same reference
      expect(initialSnapshot).toBe(source$.peek());
    });

    it("custom clone function is used for snapshots", () => {
      const cloneFn = (v: number) => v * 2;
      const source$ = observable(5);
      const { result } = renderHook(() => useManualHistory(source$, { clone: cloneFn }));

      // Initial snapshot passes through custom clone
      expect(result.current.last$.get().snapshot).toBe(10);
    });

    it("dump/parse custom serialization roundtrip", () => {
      const source$ = observable({ count: 1 });
      const { result } = renderHook(() =>
        useManualHistory(source$, {
          dump: JSON.stringify,
          parse: JSON.parse,
        })
      );

      // Initial snapshot is serialized
      expect(result.current.last$.get().snapshot).toBe('{"count":1}');

      act(() => {
        source$.set({ count: 2 });
        result.current.commit();
      });

      expect(result.current.last$.get().snapshot).toBe('{"count":2}');

      act(() => {
        result.current.undo();
      });

      // After undo, source$ should be deserialized back to object
      expect(source$.get()).toEqual({ count: 1 });
    });

    it("dump/parse: last$ snapshot is in serialized form", () => {
      const source$ = observable([1, 2, 3]);
      const { result } = renderHook(() =>
        useManualHistory(source$, {
          dump: JSON.stringify,
          parse: JSON.parse,
        })
      );

      expect(result.current.last$.get().snapshot).toBe("[1,2,3]");
    });
  });
});
