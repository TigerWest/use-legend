// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useThrottled } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useThrottled() — rerender stability", () => {
  describe("reference stability", () => {
    it("returned Observable reference is stable across re-renders", () => {
      const source$ = observable("hello");

      const { result, rerender } = renderHook(
        (props) => useThrottled(props.source, { ms: props.ms }),
        {
          initialProps: { source: source$, ms: 300 },
        }
      );

      const first = result.current;
      rerender({ source: source$, ms: 300 });
      const second = result.current;

      expect(first).toBe(second);
    });

    it("pending throttle timer persists across re-renders", () => {
      const source$ = observable("initial");

      const { result, rerender } = renderHook(
        (props) => useThrottled(props.source, { ms: props.ms }),
        {
          initialProps: { source: source$, ms: 300 },
        }
      );

      // Source change within initial window — queued for trailing
      act(() => {
        source$.set("updated");
      });

      // Advance partial time
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.get()).toBe("initial"); // trailing not yet

      // Re-render mid-flight — timer must NOT reset
      rerender({ source: source$, ms: 300 });

      // Advance remaining time — trailing fires
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.get()).toBe("updated");
    });
  });

  describe("value accuracy", () => {
    it("throttled value remains accurate after re-render", () => {
      const source$ = observable("hello");

      const { result, rerender } = renderHook(
        (props) => useThrottled(props.source, { ms: props.ms }),
        {
          initialProps: { source: source$, ms: 300 },
        }
      );

      // Expire initial window
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Leading fires immediately
      act(() => {
        source$.set("world");
      });

      expect(result.current.get()).toBe("world");

      // Re-render — value must still be accurate
      rerender({ source: source$, ms: 300 });

      expect(result.current.get()).toBe("world");
    });
  });
});
