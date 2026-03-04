// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounceFn } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useDebounceFn() — rerender stability", () => {
  describe("function identity", () => {
    it("returned function reference is stable across re-renders", () => {
      const { result, rerender } = renderHook((props) => useDebounceFn(props.fn, props.ms), {
        initialProps: { fn: vi.fn(), ms: 300 },
      });

      const first = result.current;
      rerender({ fn: vi.fn(), ms: 300 });
      const second = result.current;

      expect(first).toBe(second);
    });

    it("debounce state (pending timer) persists across re-renders", async () => {
      const cb = vi.fn();
      const { result, rerender } = renderHook((props) => useDebounceFn(props.fn, props.ms), {
        initialProps: { fn: cb, ms: 300 },
      });

      // Call debounced fn to start a pending timer
      act(() => {
        result.current();
      });

      // Re-render mid-flight — timer must NOT reset
      rerender({ fn: cb, ms: 300 });

      // Advance partial time — callback must not have fired yet
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(cb).not.toHaveBeenCalled();

      // Re-render again mid-flight
      rerender({ fn: cb, ms: 300 });

      // Advance remaining time — callback must fire exactly once
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe("callback freshness", () => {
    it("uses latest callback after re-render (stable-ref pattern)", async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const { result, rerender } = renderHook((props) => useDebounceFn(props.fn, props.ms), {
        initialProps: { fn: cb1, ms: 300 },
      });

      // Call debounced fn while cb1 is the current callback
      act(() => {
        result.current();
      });

      // Swap to cb2 before the timer fires
      rerender({ fn: cb2, ms: 300 });

      // Advance timer — cb2 (latest ref) should be called, not cb1
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });
});
