// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIntervalFn } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useIntervalFn() — rerender stability
// ---------------------------------------------------------------------------

describe("useIntervalFn() — rerender stability", () => {
  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("does not restart interval when unrelated state causes re-render", () => {
      const cb = vi.fn();
      const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
      const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

      const { rerender } = renderHook(
        ({ count }: { count: number }) => {
          void count; // unrelated prop — causes re-render without changing hook args
          return useIntervalFn(cb, 1000);
        },
        { initialProps: { count: 0 } }
      );

      const setIntervalCallsAfterMount = setIntervalSpy.mock.calls.length;
      const clearIntervalCallsAfterMount = clearIntervalSpy.mock.calls.length;

      // trigger re-renders with unrelated prop changes
      rerender({ count: 1 });
      rerender({ count: 2 });

      // setInterval / clearInterval must not be called again due to re-renders
      expect(setIntervalSpy.mock.calls.length).toBe(setIntervalCallsAfterMount);
      expect(clearIntervalSpy.mock.calls.length).toBe(clearIntervalCallsAfterMount);
    });
  });

  // -------------------------------------------------------------------------
  // callback freshness
  // -------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("callback uses latest closure after re-render", () => {
      let capturedValue = "initial";

      const { rerender } = renderHook(
        ({ label }: { label: string }) => {
          return useIntervalFn(() => {
            capturedValue = label;
          }, 1000);
        },
        { initialProps: { label: "first" } }
      );

      // update the callback closure before the interval fires
      rerender({ label: "latest" });

      // interval fires — must use the latest closure, not the stale one
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(capturedValue).toBe("latest");
    });
  });

  // -------------------------------------------------------------------------
  // state preservation
  // -------------------------------------------------------------------------

  describe("state preservation", () => {
    it("isActive$ remains true during re-render", () => {
      const { result, rerender } = renderHook(
        ({ count }: { count: number }) => {
          void count;
          return useIntervalFn(vi.fn(), 1000);
        },
        { initialProps: { count: 0 } }
      );

      // isActive$ should be true right after mount (immediate=true default)
      expect(result.current.isActive$.get()).toBe(true);

      // re-render with unrelated prop
      rerender({ count: 1 });

      // isActive$ must still be true — re-render must not reset it
      expect(result.current.isActive$.get()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("interval tick count is not affected by re-render", () => {
      const cb = vi.fn();

      const { rerender } = renderHook(
        ({ count }: { count: number }) => {
          void count;
          return useIntervalFn(cb, 1000);
        },
        { initialProps: { count: 0 } }
      );

      // advance two ticks
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(cb).toHaveBeenCalledTimes(2);

      // re-render mid-interval
      rerender({ count: 1 });

      // interval should continue ticking from where it left off
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(cb).toHaveBeenCalledTimes(3);
    });
  });
});
