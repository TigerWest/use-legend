// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useIdle } from ".";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useIdle() — reactive options", () => {
  describe("Observable option change", () => {
    it("passing timeout as observable sets initial timeout correctly", () => {
      vi.useFakeTimers();

      const timeout$ = observable(2000);
      const { result } = renderHook(() => useIdle({ timeout: timeout$ }));

      // Not idle at start (initialState defaults to false, timer started)
      expect(result.current.idle$.get()).toBe(false);

      // Advance less than timeout — still not idle
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(result.current.idle$.get()).toBe(false);

      // Advance past timeout — now idle
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(result.current.idle$.get()).toBe(true);
    });

    it("timeout$ change takes effect on next timer cycle after reset", () => {
      vi.useFakeTimers();

      const timeout$ = observable(5000);
      const { result } = renderHook(() => useIdle({ timeout: timeout$ }));

      // Not yet idle after 4s
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(result.current.idle$.get()).toBe(false);

      // Reduce timeout to 1000ms
      act(() => {
        timeout$.set(1000);
      });

      // Simulate activity to reset timer with new timeout
      act(() => {
        result.current.reset();
      });

      // After 1100ms — should now be idle with new shorter timeout
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(result.current.idle$.get()).toBe(true);
    });

    it("increasing timeout after reset delays idle trigger", () => {
      vi.useFakeTimers();

      const timeout$ = observable(1000);
      const { result } = renderHook(() => useIdle({ timeout: timeout$ }));

      // Increase timeout to 3000ms before timer fires
      act(() => {
        timeout$.set(3000);
      });

      // Reset to apply new timeout
      act(() => {
        result.current.reset();
      });

      // After 1100ms with old timeout we'd be idle, but new timeout is 3000
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(result.current.idle$.get()).toBe(false);

      // After total 3100ms — should be idle
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.idle$.get()).toBe(true);
    });

    it("passing events as observable works at mount time", () => {
      vi.useFakeTimers();

      const events$ = observable(["mousemove", "keydown"]);
      const { result } = renderHook(() => useIdle({ timeout: 500, events: events$ }));

      expect(result.current.idle$.get()).toBe(false);

      // Timer fires with the configured timeout
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(result.current.idle$.get()).toBe(true);
    });

    it("passing full options as observable works", () => {
      vi.useFakeTimers();

      const opts$ = observable({ timeout: 1000, initialState: false });
      const { result } = renderHook(() => useIdle(opts$));

      expect(result.current.idle$.get()).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(result.current.idle$.get()).toBe(true);
    });
  });
});
