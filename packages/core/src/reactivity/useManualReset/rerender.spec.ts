// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useManualReset } from ".";

describe("useManualReset() — rerender stability", () => {
  describe("reference stability", () => {
    it("value$ reference is stable across re-renders", () => {
      const { result, rerender } = renderHook((props) => useManualReset(props.defaultValue), {
        initialProps: { defaultValue: "" },
      });

      const first = result.current.value$;
      rerender({ defaultValue: "" });
      const second = result.current.value$;

      expect(first).toBe(second);
    });

    it("reset function identity is stable across re-renders", () => {
      const { result, rerender } = renderHook((props) => useManualReset(props.defaultValue), {
        initialProps: { defaultValue: "" },
      });

      const firstReset = result.current.reset;
      rerender({ defaultValue: "" });
      const secondReset = result.current.reset;

      expect(firstReset).toBe(secondReset);
    });
  });

  describe("value accuracy", () => {
    it("value remains accurate after re-render", () => {
      const { result, rerender } = renderHook((props) => useManualReset(props.defaultValue), {
        initialProps: { defaultValue: "" },
      });

      act(() => {
        result.current.value$.set("hello");
      });

      expect(result.current.value$.get()).toBe("hello");

      rerender({ defaultValue: "" });

      expect(result.current.value$.get()).toBe("hello");
    });

    it("reset still works correctly after re-render", () => {
      const { result, rerender } = renderHook((props) => useManualReset(props.defaultValue), {
        initialProps: { defaultValue: "default" },
      });

      act(() => {
        result.current.value$.set("changed");
      });

      rerender({ defaultValue: "default" });

      act(() => {
        result.current.reset();
      });

      expect(result.current.value$.get()).toBe("default");
    });
  });
});
