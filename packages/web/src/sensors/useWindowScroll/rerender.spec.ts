// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWindowScroll } from ".";

describe("useWindowScroll() — rerender stability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "scrollX", {
      writable: true,
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
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
    Object.defineProperty(document.documentElement, "scrollWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      writable: true,
      configurable: true,
      value: 2000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register window scroll listener when unrelated state causes re-render", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          // props.count simulates unrelated state; hook ignores it
          void props.count;
          return useWindowScroll();
        },
        { initialProps: { count: 0 } },
      );

      const addCallsAfterMount = addSpy.mock.calls.filter(
        ([type]) => type === "scroll",
      ).length;
      const removeCallsAfterMount = removeSpy.mock.calls.filter(
        ([type]) => type === "scroll",
      ).length;

      // Trigger re-render with unrelated prop change
      rerender({ count: 1 });
      rerender({ count: 2 });

      const addCallsAfterRerender = addSpy.mock.calls.filter(
        ([type]) => type === "scroll",
      ).length;
      const removeCallsAfterRerender = removeSpy.mock.calls.filter(
        ([type]) => type === "scroll",
      ).length;

      expect(addCallsAfterRerender).toBe(addCallsAfterMount);
      expect(removeCallsAfterRerender).toBe(removeCallsAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("scroll state remains accurate after re-render", () => {
      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useWindowScroll();
        },
        { initialProps: { count: 0 } },
      );

      // Simulate a scroll event
      act(() => {
        Object.defineProperty(window, "scrollX", {
          writable: true,
          configurable: true,
          value: 100,
        });
        Object.defineProperty(window, "scrollY", {
          writable: true,
          configurable: true,
          value: 200,
        });
        window.dispatchEvent(new Event("scroll"));
        vi.runAllTimers();
      });

      const xBeforeRerender = result.current.x$.get();
      const yBeforeRerender = result.current.y$.get();

      // Trigger unrelated re-render
      rerender({ count: 1 });

      expect(result.current.x$.get()).toBe(xBeforeRerender);
      expect(result.current.y$.get()).toBe(yBeforeRerender);
      expect(result.current.arrivedState$.get()).toEqual(
        expect.objectContaining({
          left: expect.any(Boolean),
          right: expect.any(Boolean),
          top: expect.any(Boolean),
          bottom: expect.any(Boolean),
        }),
      );
    });
  });
});
