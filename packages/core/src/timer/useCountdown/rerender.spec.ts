// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCountdown } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useCountdown() — rerender stability
// ---------------------------------------------------------------------------

describe("useCountdown() — rerender stability", () => {
  // -------------------------------------------------------------------------
  // state preservation
  // -------------------------------------------------------------------------

  describe("state preservation", () => {
    it("does not reset remaining$ when unrelated state causes re-render", () => {
      const { result, rerender } = renderHook(() => useCountdown(10));

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.remaining$.get()).toBe(7);

      // Trigger re-render with the same props
      rerender();

      // remaining$ must not reset
      expect(result.current.remaining$.get()).toBe(7);
    });

    it("pause/resume state is preserved across re-renders", () => {
      const { result, rerender } = renderHook(() => useCountdown(10));

      act(() => {
        result.current.pause();
      });
      expect(result.current.isActive$.get()).toBe(false);

      // Trigger re-render
      rerender();

      // Paused state must be preserved
      expect(result.current.isActive$.get()).toBe(false);

      // Timer must not have advanced
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.remaining$.get()).toBe(10);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("countdown continues correctly after re-render", () => {
      const { result, rerender } = renderHook(() => useCountdown(10));

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.remaining$.get()).toBe(8);

      // Trigger re-render
      rerender();

      // Countdown should continue from where it left off
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.remaining$.get()).toBe(6);
    });
  });

  // -------------------------------------------------------------------------
  // callback freshness
  // -------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("onTick/onComplete callbacks use latest closure after re-render", () => {
      const tickValues1: number[] = [];
      const tickValues2: number[] = [];

      const { rerender } = renderHook(
        (props: { onTick: (remaining: number) => void }) =>
          useCountdown(5, { onTick: props.onTick }),
        { initialProps: { onTick: (r: number) => tickValues1.push(r) } }
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(tickValues1).toEqual([4, 3]);

      // Re-render with a fresh callback reference
      rerender({ onTick: (r: number) => tickValues2.push(r) });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // New callback should receive continuing values
      expect(tickValues2).toEqual([2, 1]);
      // Old callback must no longer be called after re-render
      expect(tickValues1).toEqual([4, 3]);
    });
  });
});
