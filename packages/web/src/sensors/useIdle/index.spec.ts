// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useIdle } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useIdle()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns observable fields and reset", () => {
      const { result } = renderHook(() => useIdle());
      expect(typeof result.current.idle$.get).toBe("function");
      expect(typeof result.current.lastActive$.get).toBe("function");
      expect(typeof result.current.reset).toBe("function");
    });
  });

  describe("initial values", () => {
    it("idle$ is false by default", () => {
      const { result } = renderHook(() => useIdle());
      expect(result.current.idle$.get()).toBe(false);
    });

    it("idle$ respects initialState option", () => {
      const { result } = renderHook(() => useIdle({ initialState: true }));
      expect(result.current.idle$.get()).toBe(true);
    });

    it("lastActive$ has a timestamp", () => {
      const { result } = renderHook(() => useIdle());
      expect(result.current.lastActive$.get()).toBeTypeOf("number");
    });
  });

  describe("idle timeout", () => {
    it("becomes idle after timeout", () => {
      const { result } = renderHook(() => useIdle({ timeout: 1000 }));
      expect(result.current.idle$.get()).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.idle$.get()).toBe(true);
    });

    it("does not become idle before timeout", () => {
      const { result } = renderHook(() => useIdle({ timeout: 1000 }));

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.idle$.get()).toBe(false);
    });
  });

  describe("activity detection", () => {
    it("resets idle on mousemove", () => {
      const { result } = renderHook(() => useIdle({ timeout: 1000 }));

      // Almost idle
      act(() => {
        vi.advanceTimersByTime(900);
      });
      expect(result.current.idle$.get()).toBe(false);

      // Activity resets timer
      act(() => {
        window.dispatchEvent(new Event("mousemove"));
      });

      // Advance past original timeout — should not be idle because timer was reset
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.idle$.get()).toBe(false);

      // Now advance to full timeout from last activity
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.idle$.get()).toBe(true);
    });

    it("resets idle on keydown", () => {
      const { result } = renderHook(() => useIdle({ timeout: 1000 }));

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.idle$.get()).toBe(true);

      act(() => {
        window.dispatchEvent(new Event("keydown"));
      });
      expect(result.current.idle$.get()).toBe(false);
    });

    it("updates lastActive$ on activity", () => {
      const { result } = renderHook(() => useIdle({ timeout: 1000 }));
      const initial = result.current.lastActive$.get();

      act(() => {
        vi.advanceTimersByTime(500);
        window.dispatchEvent(new Event("mousemove"));
      });

      expect(result.current.lastActive$.get()).toBeGreaterThanOrEqual(initial);
    });
  });

  describe("reset()", () => {
    it("resets idle state and timer", () => {
      const { result } = renderHook(() => useIdle({ timeout: 1000 }));

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.idle$.get()).toBe(true);

      act(() => {
        result.current.reset();
      });
      expect(result.current.idle$.get()).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.idle$.get()).toBe(true);
    });
  });

  describe("custom events", () => {
    it("listens to custom event list", () => {
      const { result } = renderHook(() => useIdle({ timeout: 1000, events: ["click"] }));

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.idle$.get()).toBe(true);

      // mousemove should NOT reset since it's not in the custom list
      act(() => {
        window.dispatchEvent(new Event("mousemove"));
      });
      expect(result.current.idle$.get()).toBe(true);

      // click should reset
      act(() => {
        window.dispatchEvent(new Event("click"));
      });
      expect(result.current.idle$.get()).toBe(false);
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listeners and clears timer on unmount", async () => {
      vi.useRealTimers();
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useIdle({ timeout: 1000, events: ["mousemove"] }));

      unmount();
      await flush();

      const added = addSpy.mock.calls.some(([type]) => type === "mousemove");
      const removed = removeSpy.mock.calls.some(([type]) => type === "mousemove");
      expect(added).toBe(true);
      expect(removed).toBe(true);
    });
  });
});
