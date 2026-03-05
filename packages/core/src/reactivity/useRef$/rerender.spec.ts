// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useRef$ } from ".";
import { createRef } from "react";

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

    it("RefObject.current remains accurate after re-render", () => {
      const refObject = createRef<HTMLDivElement>();

      const { result, rerender } = renderHook(() => useRef$<HTMLDivElement>(refObject));
      const div = document.createElement("div");

      act(() => {
        result.current(div);
      });

      expect(refObject.current).toBe(div);

      rerender();

      expect(refObject.current).toBe(div);
      expect(result.current.get()).toBe(div);
    });
  });

  // -------------------------------------------------------------------------
  // callback freshness
  // -------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("uses latest externalRef after re-render", () => {
      const firstRef = vi.fn();

      const { result, rerender } = renderHook(
        ({ ref }: { ref: (node: HTMLDivElement | null) => void }) => useRef$<HTMLDivElement>(ref),
        { initialProps: { ref: firstRef } }
      );

      const newRef = vi.fn();
      rerender({ ref: newRef });

      const div = document.createElement("div");
      act(() => {
        result.current(div);
      });

      expect(firstRef).not.toHaveBeenCalled();
      expect(newRef).toHaveBeenCalledWith(div);
    });

    it("externalRef callback uses latest reference after re-render", () => {
      const calls: string[] = [];
      const ref1 = vi.fn(() => calls.push("ref1"));
      const ref2 = vi.fn(() => calls.push("ref2"));

      const { result, rerender } = renderHook(
        ({ ref }: { ref: (node: HTMLDivElement | null) => void }) => useRef$<HTMLDivElement>(ref),
        { initialProps: { ref: ref1 } }
      );

      rerender({ ref: ref2 });

      const div = document.createElement("div");
      act(() => {
        result.current(div);
      });

      // After re-render, only the latest ref (ref2) should be called
      expect(ref1).not.toHaveBeenCalled();
      expect(ref2).toHaveBeenCalledWith(div);
      expect(calls).toEqual(["ref2"]);
    });
  });
});
