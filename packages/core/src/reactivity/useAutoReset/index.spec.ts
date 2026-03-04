// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAutoReset } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useAutoReset()", () => {
  describe("initial value", () => {
    it("initializes with defaultValue", () => {
      const { result } = renderHook(() => useAutoReset("hello", 1000));

      expect(result.current.get()).toBe("hello");
    });

    it("initializes with Observable defaultValue", () => {
      const default$ = observable("hello");
      const { result } = renderHook(() => useAutoReset(default$, 1000));

      expect(result.current.get()).toBe("hello");
    });

    it("returns an Observable with .get() and .set()", () => {
      const { result } = renderHook(() => useAutoReset(0, 1000));

      expect(typeof result.current.get).toBe("function");
      expect(typeof result.current.set).toBe("function");
    });
  });

  describe("auto-reset behavior", () => {
    it("resets to defaultValue after afterMs when value changes", () => {
      const { result } = renderHook(() => useAutoReset("", 500));

      act(() => {
        result.current.set("hello");
      });

      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.get()).toBe("");
    });

    it("does not reset before afterMs elapses", () => {
      const { result } = renderHook(() => useAutoReset("", 500));

      act(() => {
        result.current.set("hello");
      });

      act(() => {
        vi.advanceTimersByTime(499);
      });

      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.get()).toBe("");
    });

    it("uses default 1000ms when afterMs not provided", () => {
      const { result } = renderHook(() => useAutoReset(""));

      act(() => {
        result.current.set("hello");
      });

      act(() => {
        vi.advanceTimersByTime(999);
      });

      expect(result.current.get()).toBe("hello");

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.get()).toBe("");
    });

    it("resets to latest default when defaultValue is Observable", () => {
      const default$ = observable("initial");
      const { result } = renderHook(() => useAutoReset(default$, 500));

      act(() => {
        result.current.set("changed");
      });

      // Update default while timer is pending
      act(() => {
        default$.set("updated-default");
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.get()).toBe("updated-default");
    });
  });

  describe("timer management", () => {
    it("restarts timer on each new value set", () => {
      const { result } = renderHook(() => useAutoReset("", 500));

      act(() => {
        result.current.set("first");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Set new value — timer restarts
      act(() => {
        result.current.set("second");
      });

      // 300ms more (600ms total from first, 300ms from second)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should still be "second" — timer restarted
      expect(result.current.get()).toBe("second");

      // 200ms more — 500ms from second set
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.get()).toBe("");
    });

    it("only applies latest value when set multiple times within delay", () => {
      const { result } = renderHook(() => useAutoReset("", 500));

      act(() => {
        result.current.set("a");
      });
      act(() => {
        result.current.set("b");
      });
      act(() => {
        result.current.set("c");
      });

      expect(result.current.get()).toBe("c");

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.get()).toBe("");
    });

    it("clears timer when value is manually set back to default", () => {
      const { result } = renderHook(() => useAutoReset("default", 500));

      act(() => {
        result.current.set("changed");
      });

      // Manually reset to default
      act(() => {
        result.current.set("default");
      });

      expect(result.current.get()).toBe("default");

      // Advance past delay — should still be default (no timer running)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.get()).toBe("default");
    });
  });

  describe("reactive afterMs", () => {
    it("Observable<number> afterMs — delay change restarts pending timer", () => {
      const afterMs$ = observable(500);
      const { result } = renderHook(() => useAutoReset("", afterMs$));

      act(() => {
        result.current.set("hello");
      });

      // Change delay to 1000ms while timer is pending
      act(() => {
        afterMs$.set(1000);
      });

      // 500ms — would have reset with old delay
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.get()).toBe("hello");

      // 500ms more — 1000ms total from afterMs change
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.get()).toBe("");
    });
  });

  describe("unmount cleanup", () => {
    it("does not throw after unmount when timer is pending", () => {
      const { result, unmount } = renderHook(() => useAutoReset("", 500));

      act(() => {
        result.current.set("hello");
      });

      unmount();

      expect(() => {
        act(() => {
          vi.advanceTimersByTime(500);
        });
      }).not.toThrow();
    });
  });
});
