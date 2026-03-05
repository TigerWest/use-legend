// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimeoutFn } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useTimeoutFn() — rerender stability
// ---------------------------------------------------------------------------

describe("useTimeoutFn() — rerender stability", () => {
  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("does not restart timeout when unrelated state causes re-render", () => {
      const cb = vi.fn();
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      // useMount runs start() once on mount (immediate=true default)
      // capture baseline call counts after mount
      const { rerender } = renderHook(
        ({ count }: { count: number }) => {
          void count; // unrelated prop — causes re-render without changing hook args
          return useTimeoutFn(cb, 1000);
        },
        { initialProps: { count: 0 } }
      );

      const setTimeoutCallsAfterMount = setTimeoutSpy.mock.calls.length;
      const clearTimeoutCallsAfterMount = clearTimeoutSpy.mock.calls.length;

      // trigger re-renders with unrelated prop changes
      rerender({ count: 1 });
      rerender({ count: 2 });

      // setTimeout / clearTimeout must not be called again due to re-renders
      expect(setTimeoutSpy.mock.calls.length).toBe(setTimeoutCallsAfterMount);
      expect(clearTimeoutSpy.mock.calls.length).toBe(clearTimeoutCallsAfterMount);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("pending timeout fires at correct time after re-render", () => {
      const cb = vi.fn();

      const { rerender } = renderHook(
        ({ count }: { count: number }) => {
          void count;
          return useTimeoutFn(cb, 1000);
        },
        { initialProps: { count: 0 } }
      );

      // advance partway through the timeout
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // re-render in the middle of the pending timeout
      rerender({ count: 1 });

      // cb must not have fired yet
      expect(cb).not.toHaveBeenCalled();

      // advance remaining time — callback should fire exactly once
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(cb).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // state preservation
  // -------------------------------------------------------------------------

  describe("state preservation", () => {
    it("isPending$ remains true during re-render while timeout is pending", () => {
      const { result, rerender } = renderHook(
        ({ count }: { count: number }) => {
          void count;
          return useTimeoutFn(vi.fn(), 1000);
        },
        { initialProps: { count: 0 } }
      );

      // isPending$ should be true right after mount (immediate=true starts the timer)
      expect(result.current.isPending$.get()).toBe(true);

      // re-render mid-pending
      rerender({ count: 1 });

      // isPending$ must still be true — re-render must not reset it
      expect(result.current.isPending$.get()).toBe(true);

      // after timer fires, isPending$ becomes false
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isPending$.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // callback freshness
  // -------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("callback uses latest closure after re-render", () => {
      let capturedValue = "initial";

      const { result, rerender } = renderHook(
        ({ label }: { label: string }) => {
          return useTimeoutFn(
            () => {
              capturedValue = label;
            },
            500,
            { immediate: false }
          );
        },
        { initialProps: { label: "first" } }
      );

      // start the timer
      act(() => {
        result.current.start();
      });

      // update the callback closure before the timer fires
      rerender({ label: "latest" });

      // timer fires — must use the latest closure, not the stale one
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(capturedValue).toBe("latest");
    });
  });
});
