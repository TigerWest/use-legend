// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
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
// useIntervalFn() — reactive options
// ---------------------------------------------------------------------------

describe("useIntervalFn() — reactive options", () => {
  // -------------------------------------------------------------------------
  // Observable option change
  // -------------------------------------------------------------------------

  describe("Observable option change", () => {
    it("observable interval — changing value while active restarts with new period", () => {
      const cb = vi.fn();
      const ms$ = observable(1000);
      renderHook(() => useIntervalFn(cb, ms$));

      // change interval to 500ms — old interval cleared, new one started
      act(() => {
        ms$.set(500);
      });

      // advance 500ms — new interval should fire
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(cb).toHaveBeenCalledOnce();
    });

    it("observable interval change clears the old interval before starting a new one", () => {
      const cb = vi.fn();
      const ms$ = observable(1000);
      const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

      renderHook(() => useIntervalFn(cb, ms$));

      const clearCallsAfterMount = clearIntervalSpy.mock.calls.length;

      // change interval value — must clear old interval
      act(() => {
        ms$.set(500);
      });

      expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(clearCallsAfterMount);
    });

    it("observable interval change while paused does not start the interval", () => {
      const cb = vi.fn();
      const ms$ = observable(1000);
      const { result } = renderHook(() => useIntervalFn(cb, ms$));

      act(() => {
        result.current.pause();
      });

      // change interval while paused
      act(() => {
        ms$.set(500);
      });

      // advance past new interval period — cb must not be called (paused)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(cb).not.toHaveBeenCalled();
    });
  });
});
