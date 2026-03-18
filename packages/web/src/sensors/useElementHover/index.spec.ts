// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useElementHover } from ".";

describe("useElementHover()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns an observable with .get", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => useElementHover(el));
      expect(typeof result.current.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isHovered is false initially", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => useElementHover(el));
      expect(result.current.get()).toBe(false);
    });
  });

  describe("hover events", () => {
    it("sets to true on mouseenter", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => useElementHover(el));

      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });

      expect(result.current.get()).toBe(true);
    });

    it("sets to false on mouseleave", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => useElementHover(el));

      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(true);

      act(() => {
        el.dispatchEvent(new Event("mouseleave"));
      });
      expect(result.current.get()).toBe(false);
    });
  });

  describe("delay options", () => {
    it("delays enter with delayEnter", () => {
      vi.useFakeTimers();
      const el = document.createElement("div");
      const { result } = renderHook(() => useElementHover(el, { delayEnter: 100 }));

      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(false);

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.get()).toBe(true);

      vi.useRealTimers();
    });

    it("delays leave with delayLeave", () => {
      vi.useFakeTimers();
      const el = document.createElement("div");
      const { result } = renderHook(() => useElementHover(el, { delayLeave: 100 }));

      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(true);

      act(() => {
        el.dispatchEvent(new Event("mouseleave"));
      });
      expect(result.current.get()).toBe(true); // still true during delay

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.get()).toBe(false);

      vi.useRealTimers();
    });

    it("cancels pending delay on rapid toggle", () => {
      vi.useFakeTimers();
      const el = document.createElement("div");
      const { result } = renderHook(() => useElementHover(el, { delayEnter: 100 }));

      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });
      // Cancel by leaving before delay completes
      act(() => {
        el.dispatchEvent(new Event("mouseleave"));
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });
      // Should be false because leave cancelled the enter delay
      expect(result.current.get()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe("unmount cleanup", () => {
    const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

    it("removes event listeners on unmount", async () => {
      const el = document.createElement("div");
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      const { unmount } = renderHook(() => useElementHover(el));

      // Flush microtasks so useObserve fires and registers listeners
      await act(flush);

      unmount();
      await act(flush);

      const enterAdded = addSpy.mock.calls.some(([type]) => type === "mouseenter");
      const enterRemoved = removeSpy.mock.calls.some(([type]) => type === "mouseenter");
      const leaveAdded = addSpy.mock.calls.some(([type]) => type === "mouseleave");
      const leaveRemoved = removeSpy.mock.calls.some(([type]) => type === "mouseleave");

      expect(enterAdded).toBe(true);
      expect(enterRemoved).toBe(true);
      expect(leaveAdded).toBe(true);
      expect(leaveRemoved).toBe(true);
    });

    it("does not update after unmount", async () => {
      const el = document.createElement("div");
      const { result, unmount } = renderHook(() => useElementHover(el));

      // Flush so listeners are registered
      await act(flush);

      unmount();
      await act(flush);

      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });

      expect(result.current.get()).toBe(false);
    });
  });

  describe("null target", () => {
    it("does not throw when target is null", () => {
      expect(() => {
        renderHook(() => useElementHover(null));
      }).not.toThrow();
    });
  });
});
