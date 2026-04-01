// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useObserveThrottled } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useObserveThrottled() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-register observer when unrelated state causes re-render", () => {
      const count$ = observable(0);
      let selectorCallCount = 0;

      const { rerender } = renderHook(
        ({ key: _key }) =>
          useObserveThrottled(
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
    it("uses latest effect closure after re-render when trailing fires", () => {
      const count$ = observable(0);
      const calls: string[] = [];

      const { rerender } = renderHook(
        ({ label }) =>
          useObserveThrottled(
            () => count$.get(),
            (value) => {
              calls.push(`${label}:${value}`);
            },
            { ms: 300, immediate: true }
          ),
        { initialProps: { label: "initial" } }
      );

      expect(calls).toEqual(["initial:0"]); // leading on mount

      act(() => {
        count$.set(1);
      });

      rerender({ label: "updated" });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(calls[calls.length - 1]).toMatch(/^updated:/);
    });
  });

  describe("value accuracy", () => {
    it("receives correct value after re-render", () => {
      const count$ = observable(0);
      const effect = vi.fn();

      const { rerender } = renderHook(
        (_props: { v: number }) => useObserveThrottled(() => count$.get(), effect, { ms: 300 }),
        { initialProps: { v: 0 } }
      );

      rerender({ v: 1 });

      act(() => {
        count$.set(42);
      });

      expect(effect).toHaveBeenCalledWith(42);
    });
  });

  describe("ms reactivity", () => {
    it("respects Observable ms that changes after mount", () => {
      const count$ = observable(0);
      const ms$ = observable(300);
      const effect = vi.fn();

      renderHook(() =>
        useObserveThrottled(() => count$.get(), effect, { ms: ms$, edges: ["trailing"] })
      );

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
