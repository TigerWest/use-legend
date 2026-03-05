// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDocumentVisibility } from ".";

function mockVisibilityState(value: DocumentVisibilityState) {
  return vi.spyOn(document, "visibilityState", "get").mockReturnValue(value);
}

describe("useDocumentVisibility() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register visibilitychange listener when unrelated state causes re-render", () => {
      const addSpy = vi.spyOn(document, "addEventListener");

      const { rerender } = renderHook(() => useDocumentVisibility());

      const countAfterMount = addSpy.mock.calls.filter(
        ([type]) => type === "visibilitychange"
      ).length;

      // Trigger multiple re-renders with same props (simulates unrelated state change)
      rerender();
      rerender();
      rerender();

      const countAfterRerender = addSpy.mock.calls.filter(
        ([type]) => type === "visibilitychange"
      ).length;

      // addEventListener("visibilitychange") must not be called again on re-render
      expect(countAfterRerender).toBe(countAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("visibility$ reflects correct value after multiple re-renders", () => {
      mockVisibilityState("visible");
      const { result, rerender } = renderHook(() => useDocumentVisibility());

      expect(result.current.get()).toBe("visible");

      rerender();
      expect(result.current.get()).toBe("visible");

      act(() => {
        mockVisibilityState("hidden");
        document.dispatchEvent(new Event("visibilitychange"));
      });

      rerender();
      expect(result.current.get()).toBe("hidden");

      rerender();
      expect(result.current.get()).toBe("hidden");
    });
  });

  describe("callback freshness", () => {
    it("visibilitychange event still fires correctly after re-render", () => {
      mockVisibilityState("visible");
      const { result, rerender } = renderHook(() => useDocumentVisibility());

      // Re-render before firing the event
      rerender();
      rerender();

      act(() => {
        mockVisibilityState("hidden");
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.get()).toBe("hidden");

      rerender();

      act(() => {
        mockVisibilityState("visible");
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.get()).toBe("visible");
    });
  });
});
