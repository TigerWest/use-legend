// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useInterval } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useInterval() — rerender stability
// ---------------------------------------------------------------------------

describe("useInterval() — rerender stability", () => {
  // -------------------------------------------------------------------------
  // state preservation
  // -------------------------------------------------------------------------

  describe("state preservation", () => {
    it("does not reset counter when unrelated state causes re-render", () => {
      const { result, rerender } = renderHook(() =>
        useInterval(1000, { controls: true })
      );

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.counter$.get()).toBe(3);

      // Trigger re-render with the same props
      rerender();

      // Counter must not reset
      expect(result.current.counter$.get()).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("interval continues ticking correctly after re-render", () => {
      const { result, rerender } = renderHook(() =>
        useInterval(1000, { controls: true })
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.counter$.get()).toBe(2);

      // Trigger re-render
      rerender();

      // Interval should continue ticking from where it left off
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.counter$.get()).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // callback freshness
  // -------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("callback receives correct count value after re-render", () => {
      const received: number[] = [];
      const { rerender } = renderHook(
        (props: { cb: (count: number) => void }) =>
          useInterval(1000, { callback: props.cb }),
        { initialProps: { cb: (c: number) => received.push(c) } }
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(received).toEqual([1, 2]);

      // Re-render with a fresh callback reference
      const received2: number[] = [];
      rerender({ cb: (c: number) => received2.push(c) });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // The new callback should receive the correct continuing count values
      expect(received2).toEqual([3, 4]);
      // The old callback must no longer be called after the re-render
      expect(received).toEqual([1, 2]);
    });
  });
});
