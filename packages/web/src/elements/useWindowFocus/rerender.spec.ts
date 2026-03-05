// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useWindowFocus } from ".";

describe("useWindowFocus() — rerender stability", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("resource stability", () => {
    it("does not re-register focus/blur listeners when unrelated state causes re-render", () => {
      vi.spyOn(document, "hasFocus").mockReturnValue(false);
      const addSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(() => useWindowFocus());

      const focusCallsAfterMount = addSpy.mock.calls.filter(
        ([type]) => type === "focus"
      ).length;
      const blurCallsAfterMount = addSpy.mock.calls.filter(
        ([type]) => type === "blur"
      ).length;

      rerender();
      rerender();

      const focusCallsAfterRerender = addSpy.mock.calls.filter(
        ([type]) => type === "focus"
      ).length;
      const blurCallsAfterRerender = addSpy.mock.calls.filter(
        ([type]) => type === "blur"
      ).length;

      expect(focusCallsAfterRerender).toBe(focusCallsAfterMount);
      expect(blurCallsAfterRerender).toBe(blurCallsAfterMount);

      addSpy.mockRestore();
    });
  });

  describe("value accuracy", () => {
    it("focused$ remains correct after re-render", () => {
      vi.spyOn(document, "hasFocus").mockReturnValue(false);

      const { result, rerender } = renderHook(() => useWindowFocus());

      act(() => {
        window.dispatchEvent(new Event("focus"));
      });

      expect(result.current.get()).toBe(true);

      rerender();

      expect(result.current.get()).toBe(true);
    });
  });

  describe("callback freshness", () => {
    it("focus/blur events still update focused$ after re-render", () => {
      vi.spyOn(document, "hasFocus").mockReturnValue(false);

      const { result, rerender } = renderHook(() => useWindowFocus());

      rerender();
      rerender();

      act(() => {
        window.dispatchEvent(new Event("focus"));
      });

      expect(result.current.get()).toBe(true);

      act(() => {
        window.dispatchEvent(new Event("blur"));
      });

      expect(result.current.get()).toBe(false);
    });
  });
});
