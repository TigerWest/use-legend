// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
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
      const { result, rerender } = renderHook(
        (props) => useAutoReset(props.defaultValue, props.afterMs),
        { initialProps: { defaultValue: "", afterMs: 500 } }
      );

      const first = result.current;
      rerender({ defaultValue: "", afterMs: 500 });
      const second = result.current;

      expect(first).toBe(second);
    });
  });

  describe("timer persistence", () => {
    it("pending reset timer persists across re-renders", () => {
      const { result, rerender } = renderHook(
        (props) => useAutoReset(props.defaultValue, props.afterMs),
        { initialProps: { defaultValue: "", afterMs: 500 } }
      );

      act(() => {
        result.current.set("hello");
      });

      // Advance partial time
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current.get()).toBe("hello");

      // Re-render mid-flight — timer must NOT reset
      rerender({ defaultValue: "", afterMs: 500 });

      // Advance remaining time
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current.get()).toBe("");
    });
  });

  describe("value accuracy", () => {
    it("value remains accurate after re-render", () => {
      const { result, rerender } = renderHook(
        (props) => useAutoReset(props.defaultValue, props.afterMs),
        { initialProps: { defaultValue: "", afterMs: 500 } }
      );

      act(() => {
        result.current.set("hello");
      });

      expect(result.current.get()).toBe("hello");

      rerender({ defaultValue: "", afterMs: 500 });

      expect(result.current.get()).toBe("hello");
    });

    it("reset still fires correctly after re-render", () => {
      const { result, rerender } = renderHook(
        (props) => useAutoReset(props.defaultValue, props.afterMs),
        { initialProps: { defaultValue: "default", afterMs: 500 } }
      );

      act(() => {
        result.current.set("changed");
      });

      rerender({ defaultValue: "default", afterMs: 500 });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.get()).toBe("default");
    });
  });
});
