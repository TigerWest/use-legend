// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect } from "vitest";
import { useManualReset } from ".";

describe("useManualReset() — rerender stability", () => {
  describe("reference stability", () => {
    it("value$ reference is stable across re-renders", () => {
      const source$ = observable("");
      const { result, rerender } = renderHook(() => useManualReset(source$));

      const first = result.current.value$;
      rerender();
      const second = result.current.value$;

      expect(first).toBe(second);
    });

    it("reset function identity is stable across re-renders", () => {
      const source$ = observable("");
      const { result, rerender } = renderHook(() => useManualReset(source$));

      const firstReset = result.current.reset;
      rerender();
      const secondReset = result.current.reset;

      expect(firstReset).toBe(secondReset);
    });
  });

  describe("value accuracy", () => {
    it("value remains accurate after re-render", () => {
      const source$ = observable("");
      const { result, rerender } = renderHook(() => useManualReset(source$));

      act(() => {
        result.current.value$.set("hello");
      });

      expect(result.current.value$.get()).toBe("hello");

      rerender();

      expect(result.current.value$.get()).toBe("hello");
    });

    it("reset still works correctly after re-render", () => {
      const source$ = observable("default");
      const { result, rerender } = renderHook(() => useManualReset(source$));

      act(() => {
        result.current.value$.set("changed");
      });

      rerender();

      act(() => {
        result.current.reset();
      });

      expect(result.current.value$.get()).toBe("default");
    });
  });
});
