// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useThrottledHistory } from ".";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useThrottledHistory()", () => {
  describe("throttled auto-commits", () => {
    it("does not create a duplicate initial snapshot on mount", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: 100 }));

      expect(result.current.history$.get()).toHaveLength(1);
      expect(result.current.history$.get()[0]?.snapshot).toBe(0);
    });

    it("reacts to throttle option changes without resetting history", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const throttle$ = observable(100);
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: throttle$ }));

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);

      act(() => {
        source$.set(1);
      });

      expect(snapshots()).toContain(1);

      act(() => {
        throttle$.set(300);
      });

      act(() => {
        source$.set(2);
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(snapshots()).toContain(2);
      expect(snapshots()).toContain(1);

      act(() => {
        source$.set(3);
      });

      expect(snapshots()).toContain(3);

      act(() => {
        source$.set(4);
      });
      act(() => {
        vi.advanceTimersByTime(299);
      });

      expect(snapshots()).not.toContain(4);

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(snapshots()).toContain(4);
      expect(snapshots()).toContain(1);
    });

    it("does not create a snapshot when only throttle changes", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const throttle$ = observable(100);
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: throttle$ }));

      expect(result.current.history$.get()).toHaveLength(1);

      act(() => {
        throttle$.set(250);
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.history$.get()).toHaveLength(1);
      expect(result.current.history$.get()[0]?.snapshot).toBe(0);
    });

    it("throttles auto-commits to the specified interval", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: 100 }));

      // Expire initial throttle window so leading edge resets
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Leading edge fires immediately
      act(() => {
        source$.set(1);
      });

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);
      expect(snapshots()).toContain(1);

      // Changes within the window are suppressed
      act(() => {
        source$.set(2);
      });
      act(() => {
        source$.set(3);
      });

      // Only the leading commit (1) is in history — 2 and 3 are throttled
      const historyAfterRapid = snapshots();
      expect(historyAfterRapid.filter((v) => v === 2 || v === 3).length).toBe(0);

      // Trailing fires after interval
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Now trailing commit (3) should appear
      expect(snapshots()).toContain(3);
    });

    it("default throttle interval is 200ms", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useThrottledHistory(source$));

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);

      // Expire initial window (default 200ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Leading fires
      act(() => {
        source$.set(10);
      });

      expect(snapshots()).toContain(10);

      // Within-window change is suppressed
      act(() => {
        source$.set(20);
      });

      act(() => {
        vi.advanceTimersByTime(199);
      });

      // Trailing has not fired yet
      expect(snapshots().filter((v) => v === 20).length).toBe(0);

      // Advance the last 1ms
      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(snapshots()).toContain(20);
    });

    it("rapid changes produce only leading + trailing records", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: 100 }));

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(100);
      });

      const countBefore = snapshots().length;

      // Rapid changes — leading fires on first, rest are throttled
      act(() => {
        source$.set(1);
      });
      act(() => {
        source$.set(2);
      });
      act(() => {
        source$.set(3);
      });
      act(() => {
        source$.set(4);
      });
      act(() => {
        source$.set(5);
      });

      // Advance past throttle window to flush trailing
      act(() => {
        vi.advanceTimersByTime(150);
      });

      const history = snapshots();
      // Should have at most 2 new entries (leading=1, trailing=5)
      const newEntries = history.length - countBefore;
      expect(newEntries).toBeLessThanOrEqual(2);
      expect(history).toContain(5); // trailing (last value wins)
    });
  });

  describe("inherited useHistory features", () => {
    it("undo works after throttled commits", () => {
      vi.useFakeTimers();
      const source$ = observable("a");
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: 100 }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Leading commit: "b"
      act(() => {
        source$.set("b");
      });

      // Trailing commit: "c"
      act(() => {
        source$.set("c");
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(source$.get()).toBe("c");

      act(() => {
        result.current.undo();
      });

      expect(source$.get()).toBe("b");
    });

    it("redo works after undo", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: 100 }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Commit via leading
      act(() => {
        source$.set(1);
      });

      // Commit via trailing
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

    it("canUndo$ is true after commits", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: 100 }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        source$.set(1);
      });

      expect(result.current.canUndo$.get()).toBe(true);
    });

    it("canRedo$ is true after undo", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: 100 }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        source$.set(1);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo$.get()).toBe(true);
    });

    it("clear() empties history", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() => useThrottledHistory(source$, { throttle: 100 }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        source$.set(1);
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.canUndo$.get()).toBe(false);
      expect(result.current.canRedo$.get()).toBe(false);
    });
  });

  describe("options", () => {
    it("leading: false — no leading-edge commit within throttle window", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() =>
        useThrottledHistory(source$, { throttle: 100, leading: false })
      );

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);
      const countBefore = snapshots().length;

      act(() => {
        source$.set(1);
      });

      // Leading is disabled — no immediate commit
      expect(snapshots().length).toBe(countBefore);

      // Trailing fires after interval
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(snapshots()).toContain(1);
    });

    it("trailing: false — no trailing-edge commit", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { result } = renderHook(() =>
        useThrottledHistory(source$, { throttle: 100, trailing: false })
      );

      const snapshots = () => result.current.history$.get().map((r) => r.snapshot);

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Leading fires
      act(() => {
        source$.set(1);
      });

      // Within-window change queued for trailing (but trailing is disabled)
      act(() => {
        source$.set(2);
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      // 2 should NOT appear — trailing is disabled
      expect(snapshots().filter((v) => v === 2).length).toBe(0);
    });
  });

  describe("unmount cleanup", () => {
    it("does not throw when pending throttle timer fires after unmount", () => {
      vi.useFakeTimers();
      const source$ = observable(0);
      const { unmount } = renderHook(() => useThrottledHistory(source$, { throttle: 100 }));

      act(() => {
        source$.set(1);
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
