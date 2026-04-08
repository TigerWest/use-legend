// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useThrottled } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useThrottled()", () => {
  describe("initial value", () => {
    it("initializes with current source value", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

      expect(result.current.get()).toBe("hello");
    });

    it("returns a ReadonlyObservable (.get() works immediately)", () => {
      const source$ = observable(42);
      const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

      expect(typeof result.current.get).toBe("function");
      expect(result.current.get()).toBe(42);
    });
  });

  describe("throttled updates", () => {
    it("updates immediately on source change after throttle window expires (leading edge)", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

      // The initial useObserve call consumes the leading slot.
      // Let the throttle window expire so the leading slot resets.
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now the next source change fires immediately (new leading edge)
      act(() => {
        source$.set("updated");
      });

      expect(result.current.get()).toBe("updated");
    });

    it("rate-limits rapid source changes to one per interval", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(300);
      });

      act(() => {
        source$.set("a"); // leading fires
      });

      expect(result.current.get()).toBe("a");

      act(() => {
        source$.set("b"); // suppressed
      });
      act(() => {
        source$.set("c"); // suppressed, replaces "b" in trailing queue
      });

      // Still "a" — within throttle window
      expect(result.current.get()).toBe("a");
    });

    it("applies trailing update after interval when source changed during window", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(300);
      });

      act(() => {
        source$.set("a"); // leading fires
      });

      expect(result.current.get()).toBe("a");

      act(() => {
        source$.set("b"); // queued for trailing
      });

      expect(result.current.get()).toBe("a");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Trailing fires with latest value
      expect(result.current.get()).toBe("b");
    });

    it("uses default 200ms when ms not provided", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$));

      // Expire initial window (200ms default)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      act(() => {
        source$.set("a"); // leading fires
      });

      expect(result.current.get()).toBe("a");

      act(() => {
        source$.set("b"); // queued for trailing
      });

      act(() => {
        vi.advanceTimersByTime(199);
      });

      expect(result.current.get()).toBe("a");

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.get()).toBe("b");
    });

    it("source change within initial throttle window goes through trailing", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

      // Source change immediately after mount — within initial throttle window
      act(() => {
        source$.set("updated");
      });

      // Leading was consumed by useObserve mount — update queued for trailing
      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Trailing fires
      expect(result.current.get()).toBe("updated");
    });
  });

  describe("options", () => {
    it("edges: ['leading'] — updates only on leading edge", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$, { ms: 300, edges: ["leading"] }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(300);
      });

      act(() => {
        source$.set("a"); // leading fires
      });

      expect(result.current.get()).toBe("a");

      act(() => {
        source$.set("b"); // suppressed
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // No trailing — still "a"
      expect(result.current.get()).toBe("a");
    });

    it("edges: ['trailing'] — updates only after interval ends", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$, { ms: 300, edges: ["trailing"] }));

      act(() => {
        source$.set("a"); // no leading fire
      });

      // No leading — still initial
      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Trailing fires
      expect(result.current.get()).toBe("a");
    });
  });

  describe("reactive source (Observable)", () => {
    it("Observable<T> source — tracks changes reactively", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(300);
      });

      act(() => {
        source$.set("world"); // leading fires
      });

      expect(result.current.get()).toBe("world");
    });

    it("plain T source — returns stable throttled value", () => {
      const source$ = observable("hello");
      const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // plain value never changes reactively
      expect(result.current.get()).toBe("hello");
    });
  });

  describe("reactive ms (MaybeObservable)", () => {
    it("Observable<number> ms — interval updates when observable changes", () => {
      const source$ = observable("hello");
      const ms$ = observable(100);
      const { result } = renderHook(() => useThrottled(source$, { ms: ms$ }));

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // First window with ms=100
      act(() => {
        source$.set("a"); // leading fires
      });

      expect(result.current.get()).toBe("a");

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Update ms to 500 — this triggers useObserve re-run (get(ms) is tracked),
      // which consumes the leading edge of the new window.
      act(() => {
        ms$.set(500);
      });

      // Expire the window opened by ms$ change
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Now leading is available again
      act(() => {
        source$.set("b"); // leading fires
      });

      expect(result.current.get()).toBe("b");

      act(() => {
        source$.set("c"); // queued for trailing
      });

      // 100ms not enough for 500ms interval
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.get()).toBe("b");

      // Advance remaining 400ms
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.get()).toBe("c");
    });
  });

  describe("unmount cleanup", () => {
    it("does not throw errors after unmount when pending throttle timer fires", () => {
      const source$ = observable("hello");
      const { unmount } = renderHook(() => useThrottled(source$, { ms: 300 }));

      // Source change within initial window — queued for trailing
      act(() => {
        source$.set("updated");
      });

      unmount();

      // advancing time after unmount should not throw
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(300);
        });
      }).not.toThrow();
    });
  });
});
