// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useOnline } from ".";

describe("useOnline() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("returns the same Observable reference across re-renders", () => {
      const { result, rerender } = renderHook(() => useOnline());

      const before = result.current;
      rerender();
      const after = result.current;

      expect(before).toBe(after);
    });
  });

  describe("value accuracy", () => {
    it("isOnline remains correct after re-render", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result, rerender } = renderHook(() => useOnline());

      expect(result.current.get()).toBe(true);

      rerender();
      expect(result.current.get()).toBe(true);

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });

      expect(result.current.get()).toBe(false);

      rerender();
      expect(result.current.get()).toBe(false);
    });
  });

  describe("callback freshness", () => {
    it("online/offline events still update after re-render", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result, rerender } = renderHook(() => useOnline());

      rerender();
      rerender();

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });
      expect(result.current.get()).toBe(false);

      rerender();

      act(() => {
        window.dispatchEvent(new Event("online"));
      });
      expect(result.current.get()).toBe(true);
    });
  });
});
