// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimeout } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useTimeout() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not restart timeout when unrelated state causes re-render", () => {
      const { result, rerender } = renderHook(
        (props) => useTimeout(props.interval, { controls: true }),
        { initialProps: { interval: 1000 } }
      );

      // Advance partial time — timeout is in-flight
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // isPending$ still true, ready$ still false
      expect(result.current.isPending$.get()).toBe(true);
      expect(result.current.ready$.get()).toBe(false);

      // Re-render with same props (simulates unrelated state change)
      rerender({ interval: 1000 });

      // After re-render, the timeout must not have restarted:
      // advancing 500ms more should complete the original timer (total 1000ms)
      // — NOT leave it still pending (which would happen if it restarted from 0)
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.ready$.get()).toBe(true);
      expect(result.current.isPending$.get()).toBe(false);
    });
  });

  describe("value accuracy", () => {
    it("ready$ transitions to true at correct time after re-render", () => {
      const { result, rerender } = renderHook(
        (props) => useTimeout(props.interval, { controls: true }),
        { initialProps: { interval: 1000 } }
      );

      // Advance partial time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.ready$.get()).toBe(false);

      // Re-render mid-flight — timer must NOT restart
      rerender({ interval: 1000 });

      // Advance remaining time — total 1000ms elapsed, ready$ must flip
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.ready$.get()).toBe(true);
    });
  });

  describe("state preservation", () => {
    it("isPending$ state is preserved during re-render", () => {
      const { result, rerender } = renderHook(
        (props) => useTimeout(props.interval, { controls: true }),
        { initialProps: { interval: 1000 } }
      );

      // isPending$ is true immediately after mount
      expect(result.current.isPending$.get()).toBe(true);

      // Advance partial time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Still pending before timeout fires
      expect(result.current.isPending$.get()).toBe(true);

      // Re-render — isPending$ must remain true
      rerender({ interval: 1000 });

      expect(result.current.isPending$.get()).toBe(true);
    });
  });
});
