// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useComputedWithControl } from ".";

describe("useComputedWithControl() — rerender stability", () => {
  describe("value stability", () => {
    it("value$ remains accurate after re-render with same props", () => {
      const source$ = observable(5);
      const fn = (val: number) => val * 2;
      const { result, rerender } = renderHook(
        ({ source, fn }) => useComputedWithControl(source, fn),
        { initialProps: { source: source$ as any, fn } }
      );

      expect(result.current.value$.get()).toBe(10);

      rerender({ source: source$ as any, fn });

      expect(result.current.value$.get()).toBe(10);
    });

    it("value$ updates correctly after re-render then source change", () => {
      const source$ = observable(1);
      const { result, rerender } = renderHook(
        ({ source }) => useComputedWithControl(source, (val: number) => val + 1),
        { initialProps: { source: source$ as any } }
      );

      expect(result.current.value$.get()).toBe(2);

      // Re-render with same props
      rerender({ source: source$ as any });

      // Source change after re-render
      act(() => source$.set(10));
      expect(result.current.value$.get()).toBe(11);
    });
  });

  describe("trigger stability", () => {
    it("trigger() works correctly after re-render", () => {
      let multiplier = 2;
      const source$ = observable(5);
      const { result, rerender } = renderHook(
        ({ source }) => useComputedWithControl(source, (val: number) => val * multiplier),
        { initialProps: { source: source$ as any } }
      );

      expect(result.current.value$.get()).toBe(10);

      multiplier = 3;
      rerender({ source: source$ as any });

      act(() => {
        result.current.trigger();
      });

      expect(result.current.value$.get()).toBe(15);
    });
  });

  describe("callback freshness", () => {
    it("uses latest fn closure after re-render", () => {
      const source$ = observable(1);
      const fn1 = (val: number) => val * 2;
      const fn2 = (val: number) => val * 100;

      const { result, rerender } = renderHook(({ fn }) => useComputedWithControl(source$, fn), {
        initialProps: { fn: fn1 as (val: any, prev: any) => number },
      });

      expect(result.current.value$.get()).toBe(2);

      // Re-render with new fn
      rerender({ fn: fn2 as (val: any, prev: any) => number });

      // Source change should use new fn
      act(() => source$.set(3));
      expect(result.current.value$.get()).toBe(300);
    });
  });

  describe("no redundant computation", () => {
    it("does not call fn on re-render without source change", () => {
      const source$ = observable(1);
      const fn = vi.fn((val: number) => val * 2);
      const { rerender } = renderHook(({ source }) => useComputedWithControl(source, fn), {
        initialProps: { source: source$ as any },
      });

      const callCountAfterMount = fn.mock.calls.length;

      // Re-render without source change
      rerender({ source: source$ as any });
      rerender({ source: source$ as any });
      rerender({ source: source$ as any });

      // fn should not have been called again (useObserve doesn't re-run without dep change)
      expect(fn.mock.calls.length).toBe(callCountAfterMount);
    });
  });
});
