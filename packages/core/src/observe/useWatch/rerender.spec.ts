// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useWatch } from ".";

describe("useWatch() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-register subscription on unrelated re-render", () => {
      const count$ = observable(0);
      const calls: number[] = [];

      const { rerender } = renderHook(
        (_props: { v: number }) => useWatch(count$, (val) => calls.push(val)),
        { initialProps: { v: 0 } }
      );

      rerender({ v: 1 });
      rerender({ v: 2 });

      act(() => {
        count$.set(1);
      });

      // Should fire exactly once, not once per render
      expect(calls).toEqual([1]);
    });
  });

  describe("value accuracy", () => {
    it("receives correct value after re-render", () => {
      const count$ = observable(0);
      const effect = vi.fn();

      const { rerender } = renderHook((_props: { v: number }) => useWatch(count$, effect), {
        initialProps: { v: 0 },
      });

      rerender({ v: 1 });

      act(() => {
        count$.set(42);
      });

      expect(effect).toHaveBeenCalledWith(42);
    });
  });

  describe("callback freshness", () => {
    it("uses latest selector closure after re-render", () => {
      const count$ = observable(0);
      const results: number[] = [];

      const { rerender } = renderHook(
        ({ multiplier }) =>
          useWatch(
            () => count$.get(),
            (v) => results.push((v as number) * multiplier)
          ),
        { initialProps: { multiplier: 1 } }
      );

      rerender({ multiplier: 5 });

      act(() => {
        count$.set(3);
      });

      expect(results).toEqual([15]);
    });
  });
});
