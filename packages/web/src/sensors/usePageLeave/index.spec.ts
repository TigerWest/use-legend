// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { usePageLeave } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("usePageLeave()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns an observable with .get", () => {
      const { result } = renderHook(() => usePageLeave());
      expect(typeof result.current.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("is false initially", () => {
      const { result } = renderHook(() => usePageLeave());
      expect(result.current.get()).toBe(false);
    });
  });

  describe("page leave detection", () => {
    it("sets to true on window mouseout with no relatedTarget", () => {
      const { result } = renderHook(() => usePageLeave());

      act(() => {
        window.dispatchEvent(new MouseEvent("mouseout", { relatedTarget: null }));
      });

      expect(result.current.get()).toBe(true);
    });

    it("stays false on window mouseout with relatedTarget", () => {
      const { result } = renderHook(() => usePageLeave());

      act(() => {
        const target = document.createElement("div");
        window.dispatchEvent(new MouseEvent("mouseout", { relatedTarget: target }));
      });

      expect(result.current.get()).toBe(false);
    });

    it("sets to true on document mouseleave", () => {
      const { result } = renderHook(() => usePageLeave());

      act(() => {
        document.dispatchEvent(new MouseEvent("mouseleave", { relatedTarget: null }));
      });

      expect(result.current.get()).toBe(true);
    });

    it("sets to false on document mouseenter (relatedTarget null — real browser behavior)", () => {
      const { result } = renderHook(() => usePageLeave());

      // First, leave the page
      act(() => {
        document.dispatchEvent(new MouseEvent("mouseleave", { relatedTarget: null }));
      });
      expect(result.current.get()).toBe(true);

      // Then, enter back — relatedTarget is null in real browser (mouse came from outside)
      act(() => {
        document.dispatchEvent(new MouseEvent("mouseenter", { relatedTarget: null }));
      });
      expect(result.current.get()).toBe(false);
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listeners on unmount", async () => {
      const winAddSpy = vi.spyOn(window, "addEventListener");
      const winRemoveSpy = vi.spyOn(window, "removeEventListener");
      const docAddSpy = vi.spyOn(document, "addEventListener");
      const docRemoveSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = renderHook(() => usePageLeave());
      unmount();
      await flush();

      expect(winAddSpy.mock.calls.some(([t]) => t === "mouseout")).toBe(true);
      expect(winRemoveSpy.mock.calls.some(([t]) => t === "mouseout")).toBe(true);
      expect(docAddSpy.mock.calls.some(([t]) => t === "mouseleave")).toBe(true);
      expect(docRemoveSpy.mock.calls.some(([t]) => t === "mouseleave")).toBe(true);
      expect(docAddSpy.mock.calls.some(([t]) => t === "mouseenter")).toBe(true);
      expect(docRemoveSpy.mock.calls.some(([t]) => t === "mouseenter")).toBe(true);
    });
  });
});
