// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect } from "vitest";
import { useHistory } from ".";

describe("useHistory()", () => {
  describe("auto-tracking", () => {
    it("does not create a duplicate initial snapshot on mount", () => {
      const source$ = observable("");
      const { result } = renderHook(() => useHistory(source$));

      expect(result.current.history$.get()).toHaveLength(1);
      expect(result.current.history$.get()[0]?.snapshot).toBe("");
    });

    it("automatically commits on source$ change", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      // last$ starts at the initial value
      expect(result.current.last$.get().snapshot).toBe(0);

      act(() => {
        source$.set(1);
      });

      // After change, last$ tracks the new value and undo becomes available
      expect(result.current.last$.get().snapshot).toBe(1);
      expect(result.current.canUndo$.get()).toBe(true);
    });

    it("does not commit during undo restore (no circular commit)", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      act(() => {
        source$.set(1);
      });
      act(() => {
        source$.set(2);
      });

      // Capture baseline: 2 entries in undoStack → canUndo is true, last is 2
      expect(result.current.last$.get().snapshot).toBe(2);
      const historyBefore = result.current.history$.get().length;

      act(() => {
        result.current.undo();
      });

      // Undo moved last → 1, pushed old last (2) to redo — history length decreases by 1
      expect(source$.get()).toBe(1);
      expect(result.current.last$.get().snapshot).toBe(1);
      expect(result.current.history$.get().length).toBe(historyBefore - 1);
      // Redo should be available — confirms a redo record was created, not a new commit
      expect(result.current.canRedo$.get()).toBe(true);
    });

    it("does not commit during redo restore", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      act(() => {
        source$.set(1);
      });
      act(() => {
        source$.set(2);
      });

      const historyBefore = result.current.history$.get().length;

      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.redo();
      });

      // After redo, should be back to original count — no extra commits added
      expect(source$.get()).toBe(2);
      expect(result.current.history$.get().length).toBe(historyBefore);
      expect(result.current.canRedo$.get()).toBe(false);
    });

    it("respects shouldCommit filter (return false skips recording)", () => {
      const source$ = observable(0);
      const { result } = renderHook(() =>
        useHistory(source$, { shouldCommit: (v) => v % 2 === 0 })
      );

      const baselineLength = result.current.history$.get().length;

      act(() => {
        source$.set(1); // odd → shouldCommit returns false → skip
      });

      expect(result.current.history$.get().length).toBe(baselineLength);

      act(() => {
        source$.set(2); // even → commit
      });

      expect(result.current.history$.get().length).toBe(baselineLength + 1);
      expect(result.current.last$.get().snapshot).toBe(2);
    });
  });

  describe("pause/resume", () => {
    it("pause() stops auto-commit (changes during pause are not recorded)", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      const baselineLength = result.current.history$.get().length;

      act(() => {
        result.current.pause();
      });

      act(() => {
        source$.set(1);
      });
      act(() => {
        source$.set(2);
      });

      // No new records added during pause
      expect(result.current.history$.get().length).toBe(baselineLength);
    });

    it("resume() restarts auto-commit", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      act(() => {
        result.current.pause();
      });
      act(() => {
        source$.set(1); // dropped
      });

      const baselineLength = result.current.history$.get().length;

      act(() => {
        result.current.resume();
      });
      act(() => {
        source$.set(2); // committed
      });

      expect(result.current.history$.get().length).toBe(baselineLength + 1);
      expect(result.current.last$.get().snapshot).toBe(2);
    });

    it("resume(true) commits current value immediately", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      act(() => {
        result.current.pause();
      });
      act(() => {
        source$.set(5); // paused — not auto-committed
      });

      const baselineLength = result.current.history$.get().length;

      // resume with commitCurrent=true should commit the current value (5)
      act(() => {
        result.current.resume(true);
      });

      expect(result.current.history$.get().length).toBe(baselineLength + 1);
      expect(result.current.last$.get().snapshot).toBe(5);
    });

    it("isTracking$ reflects pause/resume state", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      expect(result.current.isTracking$.get()).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isTracking$.get()).toBe(false);

      act(() => {
        result.current.resume();
      });

      expect(result.current.isTracking$.get()).toBe(true);
    });
  });

  describe("transaction", () => {
    it("groups multiple mutations into one history record", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      const baselineLength = result.current.history$.get().length;

      act(() => {
        result.current.transaction((_cancel) => {
          source$.set(10);
          source$.set(20);
          source$.set(30);
        });
      });

      // transaction completes → single commit at the end
      expect(result.current.history$.get().length).toBe(baselineLength + 1);
      expect(result.current.last$.get().snapshot).toBe(30);
    });

    it("cancel() inside transaction prevents commit", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      const baselineLength = result.current.history$.get().length;

      act(() => {
        result.current.transaction((cancel) => {
          source$.set(99);
          cancel();
        });
      });

      // no commit because cancel was called
      expect(result.current.history$.get().length).toBe(baselineLength);
    });
  });

  describe("inherited from useManualHistory", () => {
    it("undo restores previous auto-committed value", () => {
      const source$ = observable("a");
      const { result } = renderHook(() => useHistory(source$));

      act(() => {
        source$.set("b");
      });

      expect(source$.get()).toBe("b");
      expect(result.current.canUndo$.get()).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(source$.get()).toBe("a");
    });

    it("redo restores next value after undo", () => {
      const source$ = observable("a");
      const { result } = renderHook(() => useHistory(source$));

      act(() => {
        source$.set("b");
      });
      act(() => {
        result.current.undo();
      });

      expect(source$.get()).toBe("a");

      act(() => {
        result.current.redo();
      });

      expect(source$.get()).toBe("b");
    });

    it("clear resets history", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      act(() => {
        source$.set(1);
      });
      act(() => {
        source$.set(2);
      });

      expect(result.current.canUndo$.get()).toBe(true);

      act(() => {
        result.current.clear();
      });

      expect(result.current.canUndo$.get()).toBe(false);
      expect(result.current.canRedo$.get()).toBe(false);
      // After clear, history is a fresh single record
      expect(result.current.history$.get()).toHaveLength(1);
    });
  });

  describe("dispose", () => {
    it("stops auto-tracking permanently", () => {
      const source$ = observable(0);
      const { result } = renderHook(() => useHistory(source$));

      act(() => {
        result.current.dispose();
      });

      const baselineLength = result.current.history$.get().length;

      act(() => {
        source$.set(1);
      });
      act(() => {
        source$.set(2);
      });

      // dispose stops auto-commit; length unchanged
      expect(result.current.history$.get().length).toBe(baselineLength);
      expect(result.current.isTracking$.get()).toBe(false);
    });
  });
});
