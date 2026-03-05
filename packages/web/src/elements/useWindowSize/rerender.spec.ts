// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWindowSize } from ".";

function mockMatchMedia(matches = false): (query: string) => MediaQueryList {
  return (_query: string) =>
    ({
      matches,
      media: _query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

describe("useWindowSize() — rerender stability", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", mockMatchMedia());

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register resize listener when unrelated state causes re-render", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          // props.count simulates unrelated state; hook ignores it
          void props.count;
          return useWindowSize();
        },
        { initialProps: { count: 0 } }
      );

      const addCallsAfterMount = addSpy.mock.calls.filter(([type]) => type === "resize").length;
      const removeCallsAfterMount = removeSpy.mock.calls.filter(
        ([type]) => type === "resize"
      ).length;

      // Trigger re-renders with unrelated prop changes
      rerender({ count: 1 });
      rerender({ count: 2 });

      const addCallsAfterRerender = addSpy.mock.calls.filter(([type]) => type === "resize").length;
      const removeCallsAfterRerender = removeSpy.mock.calls.filter(
        ([type]) => type === "resize"
      ).length;

      expect(addCallsAfterRerender).toBe(addCallsAfterMount);
      expect(removeCallsAfterRerender).toBe(removeCallsAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("width and height remain accurate after unrelated re-render", () => {
      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useWindowSize();
        },
        { initialProps: { count: 0 } }
      );

      // Simulate a resize event to update values
      act(() => {
        (window as any).innerWidth = 1280;
        (window as any).innerHeight = 900;
        window.dispatchEvent(new Event("resize"));
      });

      const widthBeforeRerender = result.current.width.get();
      const heightBeforeRerender = result.current.height.get();

      expect(widthBeforeRerender).toBe(1280);
      expect(heightBeforeRerender).toBe(900);

      // Trigger unrelated re-render
      rerender({ count: 1 });

      expect(result.current.width.get()).toBe(widthBeforeRerender);
      expect(result.current.height.get()).toBe(heightBeforeRerender);
    });
  });
});
