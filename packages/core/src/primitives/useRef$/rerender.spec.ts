// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useRef$ } from ".";

// ---------------------------------------------------------------------------
// useRef$() — rerender stability
// ---------------------------------------------------------------------------

describe("useRef$() — rerender stability", () => {
  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("el$ maintains stable reference across re-renders", () => {
      const { result, rerender } = renderHook(() => useRef$<HTMLDivElement>());
      const el$1 = result.current;

      rerender();

      expect(result.current).toBe(el$1);
    });

    it("callback ref identity is stable across re-renders (React does not re-invoke ref)", () => {
      const { result, rerender } = renderHook(() => useRef$<HTMLDivElement>());
      const el$Before = result.current;

      const div = document.createElement("div");
      act(() => {
        result.current(div);
      });

      rerender();

      // The callback ref identity must not change — if it changed React would
      // re-invoke cleanup (null) and then the new ref, causing an extra null cycle
      expect(result.current).toBe(el$Before);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("observable value persists correctly after re-render", () => {
      const { result, rerender } = renderHook(() => useRef$<HTMLDivElement>());
      const div = document.createElement("div");

      act(() => {
        result.current(div);
      });

      expect(result.current.get()).toBe(div);

      rerender();

      expect(result.current.get()).toBe(div);
    });
  });
});
