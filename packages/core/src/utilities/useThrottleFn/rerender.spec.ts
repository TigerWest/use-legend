// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useThrottleFn } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useThrottleFn() — rerender stability", () => {
  describe("function identity", () => {
    it("returned function reference is stable across re-renders", () => {
      const { result, rerender } = renderHook((props) => useThrottleFn(props.fn, props.ms), {
        initialProps: { fn: vi.fn(), ms: 300 },
      });

      const first = result.current;
      rerender({ fn: vi.fn(), ms: 300 });
      const second = result.current;

      expect(first).toBe(second);
    });

    it("throttle state persists across re-renders", () => {
      const cb = vi.fn();
      const { result, rerender } = renderHook((props) => useThrottleFn(props.fn, props.ms), {
        initialProps: { fn: cb, ms: 300 },
      });

      // Call throttled fn — leading fires immediately
      act(() => {
        result.current();
      });

      expect(cb).toHaveBeenCalledTimes(1);

      // Call again to queue trailing
      act(() => {
        result.current();
      });

      // Re-render mid-flight — trailing timer must NOT reset
      rerender({ fn: cb, ms: 300 });

      // Advance partial time
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(cb).toHaveBeenCalledTimes(1); // trailing not yet

      // Re-render again mid-flight
      rerender({ fn: cb, ms: 300 });

      // Advance remaining time — trailing fires
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(cb).toHaveBeenCalledTimes(2);
    });
  });

  describe("callback freshness", () => {
    it("uses latest callback after re-render (stable-ref pattern)", () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const { result, rerender } = renderHook((props) => useThrottleFn(props.fn, props.ms), {
        initialProps: { fn: cb1, ms: 300 },
      });

      // First call — leading fires with cb1
      act(() => {
        result.current();
      });

      expect(cb1).toHaveBeenCalledTimes(1);

      // Queue trailing call then swap to cb2 before trailing fires
      act(() => {
        result.current();
      });

      rerender({ fn: cb2, ms: 300 });

      // Advance timer — trailing should call cb2 (latest ref), not cb1
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(cb1).toHaveBeenCalledTimes(1); // no additional calls
      expect(cb2).toHaveBeenCalledTimes(1); // trailing used cb2
    });
  });
});
