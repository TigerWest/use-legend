// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounced } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useDebounced() — rerender stability", () => {
  describe("reference stability", () => {
    it("returned Observable reference is stable across re-renders", () => {
      const source$ = observable("hello");

      const { result, rerender } = renderHook(
        (props) => useDebounced(props.source, { ms: props.ms }),
        {
          initialProps: { source: source$, ms: 300 },
        }
      );

      const first = result.current;
      rerender({ source: source$, ms: 300 });
      const second = result.current;

      expect(first).toBe(second);
    });

    it("pending debounce timer persists across re-renders", () => {
      const source$ = observable("initial");

      const { result, rerender } = renderHook(
        (props) => useDebounced(props.source, { ms: props.ms }),
        {
          initialProps: { source: source$, ms: 300 },
        }
      );

      // Change source to start a pending debounce timer
      act(() => {
        source$.set("updated");
      });

      // Advance partial time — debounced value must not have updated yet
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.get()).toBe("initial");

      // Re-render mid-flight — timer must NOT reset
      rerender({ source: source$, ms: 300 });

      // Advance remaining time — debounced value must now update
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.get()).toBe("updated");
    });
  });

  describe("value accuracy", () => {
    it("debounced value remains accurate after re-render", () => {
      const source$ = observable("hello");

      const { result, rerender } = renderHook(
        (props) => useDebounced(props.source, { ms: props.ms }),
        {
          initialProps: { source: source$, ms: 300 },
        }
      );

      // Complete a full debounce cycle
      act(() => {
        source$.set("world");
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.get()).toBe("world");

      // Re-render — value must still be accurate
      rerender({ source: source$, ms: 300 });

      expect(result.current.get()).toBe("world");
    });
  });
});
