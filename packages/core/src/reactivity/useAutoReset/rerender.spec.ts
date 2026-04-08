// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAutoReset } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useAutoReset() — rerender stability", () => {
  describe("reference stability", () => {
    it("returned Observable reference is stable across re-renders", () => {
      const source$ = observable("");
      const afterMs$ = observable(500);
      const { result, rerender } = renderHook(() => useAutoReset(source$, { afterMs: afterMs$ }));

      const first = result.current;
      rerender();
      const second = result.current;

      expect(first).toBe(second);
    });
  });

  describe("timer persistence", () => {
    it("pending reset timer persists across re-renders", () => {
      const source$ = observable("");
      const afterMs$ = observable(500);
      const { result, rerender } = renderHook(() => useAutoReset(source$, { afterMs: afterMs$ }));

      act(() => {
        result.current.set("hello");
      });

      // Advance partial time
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current.get()).toBe("hello");

      // Re-render mid-flight — timer must NOT reset
      rerender();

      // Advance remaining time
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current.get()).toBe("");
    });
  });

  describe("value accuracy", () => {
    it("value remains accurate after re-render", () => {
      const source$ = observable("");
      const afterMs$ = observable(500);
      const { result, rerender } = renderHook(() => useAutoReset(source$, { afterMs: afterMs$ }));

      act(() => {
        result.current.set("hello");
      });

      expect(result.current.get()).toBe("hello");

      rerender();

      expect(result.current.get()).toBe("hello");
    });

    it("reset still fires correctly after re-render", () => {
      const source$ = observable("default");
      const afterMs$ = observable(500);
      const { result, rerender } = renderHook(() => useAutoReset(source$, { afterMs: afterMs$ }));

      act(() => {
        result.current.set("changed");
      });

      rerender();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.get()).toBe("default");
    });
  });
});
