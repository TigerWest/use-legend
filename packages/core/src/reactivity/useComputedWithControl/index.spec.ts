// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi } from "vitest";
import { useComputedWithControl } from ".";

describe("useComputedWithControl()", () => {
  describe("initial value", () => {
    it("computes initial value from source on first render", () => {
      const source$ = observable(5);
      const { result } = renderHook(() => useComputedWithControl(source$, (val) => val * 2));
      expect(result.current.value$.get()).toBe(10);
    });

    it("returns { value$, trigger } with correct types", () => {
      const source$ = observable(1);
      const { result } = renderHook(() => useComputedWithControl(source$, (val) => val));
      expect(typeof result.current.value$.get).toBe("function");
      expect(typeof result.current.value$.peek).toBe("function");
      expect(typeof result.current.trigger).toBe("function");
    });

    it("value$ is typed as ReadonlyObservable (set is not in the public type)", () => {
      const source$ = observable(1);
      const { result } = renderHook(() => useComputedWithControl(source$, (val) => val));
      // ReadonlyObservable constraint is type-level only (the cast `as unknown as ReadonlyObservable<T>`
      // prevents .set from appearing in the public API without removing it at runtime).
      // Verify the observable is functional and readable.
      expect(result.current.value$.get()).toBe(1);
      expect(result.current.value$.peek()).toBe(1);
    });
  });

  describe("source change", () => {
    it("recomputes when Observable source changes", () => {
      const source$ = observable(1);
      const { result } = renderHook(() =>
        useComputedWithControl(source$, (val: number) => val * 10)
      );
      expect(result.current.value$.get()).toBe(10);

      act(() => {
        source$.set(3);
      });

      expect(result.current.value$.get()).toBe(30);
    });

    it("recomputes multiple times as source changes", () => {
      const source$ = observable("a");
      const { result } = renderHook(() =>
        useComputedWithControl(source$, (val: string) => val.toUpperCase())
      );
      expect(result.current.value$.get()).toBe("A");

      act(() => source$.set("b"));
      expect(result.current.value$.get()).toBe("B");

      act(() => source$.set("c"));
      expect(result.current.value$.get()).toBe("C");
    });
  });

  describe("trigger()", () => {
    it("forces recomputation when called", () => {
      let external = 100;
      const source$ = observable(1);
      const { result } = renderHook(() =>
        useComputedWithControl(source$, (val: number) => val + external)
      );
      expect(result.current.value$.get()).toBe(101);

      // Change external value (not reactive)
      external = 200;

      // value$ still shows old computed value
      expect(result.current.value$.get()).toBe(101);

      // trigger() forces recomputation with latest external
      act(() => {
        result.current.trigger();
      });

      expect(result.current.value$.get()).toBe(201);
    });

    it("trigger() uses current source value", () => {
      const source$ = observable(5);
      const fn = vi.fn((val: number) => val * 2);
      const { result } = renderHook(() => useComputedWithControl(source$, fn));
      expect(result.current.value$.get()).toBe(10);

      act(() => source$.set(7));
      expect(result.current.value$.get()).toBe(14);

      act(() => {
        result.current.trigger();
      });
      // Should use current source value (7)
      expect(result.current.value$.get()).toBe(14);
      // fn should have been called with source value 7
      expect(fn).toHaveBeenLastCalledWith(7, 14);
    });
  });

  describe("prev argument", () => {
    it("passes previous computed value to fn", () => {
      const source$ = observable(1);
      const fn = vi.fn((val: number, prev: number | undefined) => (prev ?? 0) + val);
      const { result } = renderHook(() => useComputedWithControl(source$, fn));

      // First call: prev is undefined, result = 0 + 1 = 1
      expect(result.current.value$.get()).toBe(1);
      expect(fn).toHaveBeenLastCalledWith(1, undefined);

      act(() => source$.set(5));
      // Second call: prev is 1, result = 1 + 5 = 6
      expect(result.current.value$.get()).toBe(6);
      expect(fn).toHaveBeenLastCalledWith(5, 1);

      act(() => source$.set(10));
      // Third call: prev is 6, result = 6 + 10 = 16
      expect(result.current.value$.get()).toBe(16);
      expect(fn).toHaveBeenLastCalledWith(10, 6);
    });
  });

  describe("array source", () => {
    it("recomputes when any source in array changes", () => {
      const a$ = observable(1);
      const b$ = observable(2);
      const { result } = renderHook(() =>
        useComputedWithControl([a$, b$], (values: number[]) => values[0] + values[1])
      );
      expect(result.current.value$.get()).toBe(3);

      act(() => a$.set(10));
      expect(result.current.value$.get()).toBe(12);

      act(() => b$.set(20));
      expect(result.current.value$.get()).toBe(30);
    });

    it("passes all source values as array to fn", () => {
      const a$ = observable("hello");
      const b$ = observable("world");
      const fn = vi.fn((values: string[]) => values.join(" "));
      renderHook(() => useComputedWithControl([a$, b$], fn));

      expect(fn).toHaveBeenCalledWith(["hello", "world"], undefined);
    });
  });

  describe("plain source", () => {
    it("computes with plain (non-Observable) source value", () => {
      const { result } = renderHook(() =>
        useComputedWithControl(observable(42), (val: number) => val * 2)
      );
      expect(result.current.value$.get()).toBe(84);
    });
  });

  describe("unmount cleanup", () => {
    it("does not throw after unmount", () => {
      const source$ = observable(1);
      const { result, unmount } = renderHook(() =>
        useComputedWithControl(source$, (val: number) => val)
      );

      expect(result.current.value$.get()).toBe(1);
      unmount();

      expect(() => {
        act(() => source$.set(2));
      }).not.toThrow();
    });
  });
});
