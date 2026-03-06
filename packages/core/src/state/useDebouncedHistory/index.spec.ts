// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDebouncedHistory } from ".";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useDebouncedHistory()", () => {
  describe("debounced auto-commits", () => {
    it("does not create a duplicate initial snapshot on mount", () => {
      vi.useFakeTimers();
      const source$ = observable("");
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      expect(result.current.history$.get()).toHaveLength(1);
      expect(result.current.history$.get()[0]?.snapshot).toBe("");
    });

    it("reacts to debounce option changes without resetting history", () => {
      vi.useFakeTimers();
      const source$ = observable("");
      const debounce$ = observable(100);
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: debounce$ }));

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);

      act(() => {
        source$.set("a");
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(snapshots()).toContain("a");

      act(() => {
        debounce$.set(250);
        source$.set("ab");
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(snapshots()).toContain("a");
      expect(snapshots()).not.toContain("ab");

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(snapshots()).toContain("ab");
      expect(snapshots()).toContain("a");
    });

    it("does not create a snapshot when only debounce changes", () => {
      vi.useFakeTimers();
      const source$ = observable("");
      const debounce$ = observable(100);
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: debounce$ }));

      expect(result.current.history$.get()).toHaveLength(1);

      act(() => {
        debounce$.set(250);
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.history$.get()).toHaveLength(1);
      expect(result.current.history$.get()[0]?.snapshot).toBe("");
    });

    it("debounces auto-commits to the specified delay", () => {
      vi.useFakeTimers();
      const source$ = observable("");
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);

      // Rapid changes
      act(() => {
        source$.set("h");
      });
      act(() => {
        source$.set("he");
      });
      act(() => {
        source$.set("hel");
      });

      // Timer has not elapsed — intermediate values should not be committed
      expect(snapshots().filter((v) => v === "h" || v === "he").length).toBe(0);

      // Advance past debounce window
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Only the final value should be in history
      expect(snapshots()).toContain("hel");
    });

    it("default debounce delay is 200ms", () => {
      vi.useFakeTimers();
      const source$ = observable("");
      const { result } = renderHook(() => useDebouncedHistory(source$));

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);

      act(() => {
        source$.set("a");
      });
      act(() => {
        source$.set("ab");
      });

      // 199ms — should not have committed yet
      act(() => {
        vi.advanceTimersByTime(199);
      });

      expect(snapshots().filter((v) => v === "ab").length).toBe(0);

      // 1ms more — debounce fires
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(snapshots()).toContain("ab");
    });

    it("only records after source stops changing", () => {
      vi.useFakeTimers();
      const source$ = observable("");
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);

      // Continuous changes — each resets the debounce timer
      act(() => {
        source$.set("t");
      });
      act(() => {
        vi.advanceTimersByTime(80);
      });
      act(() => {
        source$.set("ty");
      });
      act(() => {
        vi.advanceTimersByTime(80);
      });
      act(() => {
        source$.set("typ");
      });
      act(() => {
        vi.advanceTimersByTime(80);
      });

      // None committed yet — still within active debounce
      expect(snapshots().filter((v) => v === "t" || v === "ty").length).toBe(0);

      // Stop changing — advance past debounce
      act(() => {
        vi.advanceTimersByTime(120);
      });

      expect(snapshots()).toContain("typ");
    });

    it("rapid input produces a single history record after settling", () => {
      vi.useFakeTimers();
      const source$ = observable("");
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);
      const countBefore = snapshots().length;

      // Simulate typing "hello"
      for (const char of ["h", "he", "hel", "hell", "hello"]) {
        act(() => {
          source$.set(char);
        });
      }

      // Advance past debounce window
      act(() => {
        vi.advanceTimersByTime(150);
      });

      const history = snapshots();
      const newEntries = history.length - countBefore;

      // Exactly one new entry for the entire typing burst
      expect(newEntries).toBe(1);
      expect(history).toContain("hello");
      // Intermediate values should NOT be recorded
      expect(history.filter((v) => v === "h" || v === "he" || v === "hel").length).toBe(0);
    });
  });

  describe("inherited useHistory features", () => {
    it("undo works after debounced commits", () => {
      vi.useFakeTimers();
      const source$ = observable("initial");
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      // First commit: "first"
      act(() => {
        source$.set("first");
      });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Second commit: "second"
      act(() => {
        source$.set("second");
      });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(source$.get()).toBe("second");

      act(() => {
        result.current.undo();
      });

      expect(source$.get()).toBe("first");
    });

    it("redo works after undo", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      // Commit 1
      act(() => {
        source$.set(1);
      });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Commit 2
      act(() => {
        source$.set(2);
      });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      act(() => {
        result.current.undo();
      });

      expect(source$.get()).toBe(1);

      act(() => {
        result.current.redo();
      });

      expect(source$.get()).toBe(2);
    });

    it("canUndo$ is false before debounce settles, true after commit", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      act(() => {
        source$.set(1);
      });

      // Before debounce settles — no commit yet
      expect(result.current.canUndo$.get()).toBe(false);

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.canUndo$.get()).toBe(true);
    });

    it("canRedo$ is true after undo", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      act(() => {
        source$.set(1);
      });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo$.get()).toBe(true);
    });

    it("clear() empties history", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      act(() => {
        source$.set(1);
      });
      act(() => {
        vi.advanceTimersByTime(150);
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.canUndo$.get()).toBe(false);
      expect(result.current.canRedo$.get()).toBe(false);
    });
  });

  describe("options", () => {
    it("maxWait forces a commit before the debounce delay elapses", () => {
      vi.useFakeTimers();
      const source$ = observable("");
      const { result } = renderHook(() =>
        useDebouncedHistory(source$, { debounce: 500, maxWait: 200 })
      );

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);
      const countBefore = snapshots().length;

      // Keep changing to prevent normal debounce from firing
      act(() => {
        source$.set("a");
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      act(() => {
        source$.set("ab");
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      // maxWait (200ms total) has elapsed — a forced commit should fire
      act(() => {
        source$.set("abc");
      });
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // A commit should have been forced by maxWait before debounce (500ms) fired
      expect(snapshots().length).toBeGreaterThan(countBefore);
    });
  });

  describe("unmount cleanup", () => {
    it("does not throw when pending debounce timer fires after unmount", () => {
      vi.useFakeTimers();
      const source$ = observable("");
      const { unmount } = renderHook(() => useDebouncedHistory(source$, { debounce: 100 }));

      act(() => {
        source$.set("hello");
      });

      unmount();

      expect(() => {
        act(() => {
          vi.advanceTimersByTime(150);
        });
      }).not.toThrow();
    });
  });
});
