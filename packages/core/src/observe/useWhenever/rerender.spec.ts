// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useWhenever } from ".";

describe("useWhenever() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-register watch subscription on re-render", () => {
      const flag$ = observable(false);
      const effect = vi.fn();

      const { rerender } = renderHook(
        ({ label }: { label: string }) => useWhenever(flag$, () => effect(label)),
        { initialProps: { label: "a" } }
      );

      rerender({ label: "b" });
      rerender({ label: "c" });

      act(() => {
        flag$.set(true);
      });

      // Effect fires once — subscription was not re-registered
      expect(effect).toHaveBeenCalledTimes(1);
    });
  });

  describe("callback freshness", () => {
    it("uses latest effect closure after re-render", () => {
      const flag$ = observable(false);
      const results: string[] = [];

      const { rerender } = renderHook(
        ({ label }: { label: string }) => useWhenever(flag$, () => results.push(label)),
        { initialProps: { label: "initial" } }
      );

      rerender({ label: "updated" });

      act(() => {
        flag$.set(true);
      });

      expect(results).toEqual(["updated"]);
    });
  });

  describe("value accuracy", () => {
    it("correctly receives truthy value after re-render", () => {
      const value$ = observable<string | null>(null);
      const received: string[] = [];

      const { rerender } = renderHook(
        (_: { tick: number }) =>
          useWhenever(
            () => value$.get(),
            (v) => received.push(v)
          ),
        { initialProps: { tick: 0 } }
      );

      rerender({ tick: 1 });

      act(() => {
        value$.set("hello");
      });

      expect(received).toEqual(["hello"]);
    });
  });

  describe("once option", () => {
    it("does not re-activate after re-render when once: true has already fired", () => {
      const flag$ = observable(false);
      const effect = vi.fn();

      const { rerender } = renderHook(
        (_: { tick: number }) => useWhenever(flag$, effect, { once: true }),
        { initialProps: { tick: 0 } }
      );

      // trigger the once
      act(() => {
        flag$.set(true);
      });
      expect(effect).toHaveBeenCalledTimes(1);

      // re-render
      rerender({ tick: 1 });

      // should not fire again even if value becomes truthy again
      act(() => {
        flag$.set(false);
      });
      act(() => {
        flag$.set(true);
      });

      expect(effect).toHaveBeenCalledTimes(1);
    });
  });

  describe("state preservation", () => {
    it("does not fire for falsy values even after re-render", () => {
      const flag$ = observable(false);
      const effect = vi.fn();

      const { rerender } = renderHook((_: { tick: number }) => useWhenever(flag$, effect), {
        initialProps: { tick: 0 },
      });

      rerender({ tick: 1 });

      act(() => {
        flag$.set(false);
      });

      expect(effect).not.toHaveBeenCalled();
    });
  });
});
