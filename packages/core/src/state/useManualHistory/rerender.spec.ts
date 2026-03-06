// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect } from "vitest";
import { useManualHistory } from ".";

describe("useManualHistory() — rerender stability", () => {
  describe("reference stability", () => {
    it("canUndo$ reference is stable across re-renders", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      const canUndoBefore = result.current.canUndo$;
      rerender();
      const canUndoAfter = result.current.canUndo$;

      expect(canUndoAfter).toBe(canUndoBefore);
    });

    it("canRedo$ reference is stable across re-renders", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      const canRedoBefore = result.current.canRedo$;
      rerender();
      const canRedoAfter = result.current.canRedo$;

      expect(canRedoAfter).toBe(canRedoBefore);
    });

    it("history$ reference is stable across re-renders", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      const historyBefore = result.current.history$;
      rerender();
      const historyAfter = result.current.history$;

      expect(historyAfter).toBe(historyBefore);
    });

    it("last$ reference is stable across re-renders", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      const lastBefore = result.current.last$;
      rerender();
      const lastAfter = result.current.last$;

      expect(lastAfter).toBe(lastBefore);
    });

    // Note: commit/undo/redo are plain closures — not memoized.
    // Their *functionality* after rerender is tested in "functionality after re-render" below.
  });

  describe("state preservation after re-render", () => {
    it("history state preserved after unrelated re-render", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        source$.set(2);
        result.current.commit();
      });

      const historyBefore = result.current.history$.get();
      rerender();
      const historyAfter = result.current.history$.get();

      expect(historyAfter).toHaveLength(historyBefore.length);
      expect(historyAfter[0].snapshot).toBe(historyBefore[0].snapshot);
    });

    it("canUndo$ value is preserved after re-render", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });

      expect(result.current.canUndo$.get()).toBe(true);
      rerender();
      expect(result.current.canUndo$.get()).toBe(true);
    });

    it("canRedo$ value is preserved after re-render", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo$.get()).toBe(true);
      rerender();
      expect(result.current.canRedo$.get()).toBe(true);
    });

    it("last$ value is preserved after re-render", () => {
      const source$ = observable("original");
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set("committed");
        result.current.commit();
      });

      const snapshotBefore = result.current.last$.get().snapshot;
      rerender();
      expect(result.current.last$.get().snapshot).toBe(snapshotBefore);
    });
  });

  describe("functionality after re-render", () => {
    it("commit still works correctly after re-render", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      rerender();

      act(() => {
        source$.set(10);
        result.current.commit();
      });

      expect(result.current.canUndo$.get()).toBe(true);
      expect(result.current.last$.get().snapshot).toBe(10);
    });

    it("undo still works correctly after re-render", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(5);
        result.current.commit();
      });

      rerender();

      act(() => {
        result.current.undo();
      });

      expect(source$.get()).toBe(0);
      expect(result.current.canUndo$.get()).toBe(false);
    });

    it("redo still works correctly after re-render", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(5);
        result.current.commit();
      });
      act(() => {
        result.current.undo();
      });

      rerender();

      act(() => {
        result.current.redo();
      });

      expect(source$.get()).toBe(5);
      expect(result.current.canRedo$.get()).toBe(false);
    });

    it("full undo/redo cycle works across multiple re-renders", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });
      rerender();

      act(() => {
        source$.set(2);
        result.current.commit();
      });
      rerender();

      act(() => {
        result.current.undo();
      });
      expect(source$.get()).toBe(1);

      rerender();

      act(() => {
        result.current.redo();
      });
      expect(source$.get()).toBe(2);
    });

    it("clear works correctly after re-render", () => {
      const source$ = observable(0);
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set(1);
        result.current.commit();
      });

      rerender();

      act(() => {
        result.current.clear();
      });

      expect(result.current.canUndo$.get()).toBe(false);
      expect(result.current.canRedo$.get()).toBe(false);
      expect(result.current.history$.get()).toHaveLength(1);
    });

    it("reset works correctly after re-render", () => {
      const source$ = observable("original");
      const { result, rerender } = renderHook(() => useManualHistory(source$));

      act(() => {
        source$.set("committed");
        result.current.commit();
      });
      act(() => {
        source$.set("uncommitted");
      });

      rerender();

      act(() => {
        result.current.reset();
      });

      expect(source$.get()).toBe("committed");
    });
  });
});
