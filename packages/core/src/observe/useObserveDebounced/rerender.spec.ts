// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useObserveDebounced } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useObserveDebounced() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-register observer when unrelated state causes re-render", () => {
      const count$ = observable(0);
      let selectorCallCount = 0;

      const { rerender } = renderHook(
        ({ key: _key }) =>
          useObserveDebounced(
            () => {
              selectorCallCount++;
              return count$.get();
            },
            () => {},
            { ms: 300 }
          ),
        { initialProps: { key: 0 } }
      );

      const callsAfterMount = selectorCallCount;

      rerender({ key: 1 });
      rerender({ key: 2 });

      expect(selectorCallCount).toBe(callsAfterMount);

      act(() => {
        count$.set(1);
      });

      expect(selectorCallCount).toBe(callsAfterMount + 1);
    });
  });

  describe("callback freshness", () => {
    it("uses latest effect closure after re-render when debounce fires", () => {
      const count$ = observable(0);
      const calls: string[] = [];

      const { rerender } = renderHook(
        ({ label }) =>
          useObserveDebounced(
            () => count$.get(),
            () => {
              calls.push(label);
            },
            { ms: 300 }
          ),
        { initialProps: { label: "initial" } }
      );

      act(() => {
        count$.set(1);
      });

      rerender({ label: "updated" });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(calls).toEqual(["updated"]);
    });
  });

  describe("value accuracy", () => {
    it("receives correct value after re-render when debounce fires", () => {
      const count$ = observable(0);
      const received: number[] = [];

      const { rerender } = renderHook(
        (_props: { v: number }) =>
          useObserveDebounced(
            () => count$.get(),
            (v) => received.push(v as number),
            { ms: 300 }
          ),
        { initialProps: { v: 0 } }
      );

      rerender({ v: 1 });

      act(() => {
        count$.set(42);
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(received).toEqual([42]);
    });
  });

  describe("ms reactivity", () => {
    it("respects Observable ms that changes after mount", () => {
      const count$ = observable(0);
      const ms$ = observable(300);
      const effect = vi.fn();

      renderHook(() => useObserveDebounced(() => count$.get(), effect, { ms: ms$ }));

      act(() => {
        count$.set(1);
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(effect).not.toHaveBeenCalled();

      act(() => {
        ms$.set(100);
      });
      act(() => {
        count$.set(2);
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(effect).toHaveBeenCalledTimes(1);
      expect(effect).toHaveBeenCalledWith(2);
    });
  });
});
