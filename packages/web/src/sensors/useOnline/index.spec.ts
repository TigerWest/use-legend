// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useOnline } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useOnline()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns an Observable with .get()", () => {
      const { result } = renderHook(() => useOnline());
      expect(typeof result.current.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("reflects navigator.onLine after mount", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result } = renderHook(() => useOnline());
      expect(result.current.get()).toBe(true);
    });

    it("reflects offline when navigator.onLine is false", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
      const { result } = renderHook(() => useOnline());
      expect(result.current.get()).toBe(false);
    });
  });

  describe("online/offline events", () => {
    it("updates to true on online event", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
      const { result } = renderHook(() => useOnline());

      act(() => {
        vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
        window.dispatchEvent(new Event("online"));
      });

      expect(result.current.get()).toBe(true);
    });

    it("updates to false on offline event", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result } = renderHook(() => useOnline());

      act(() => {
        vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
        window.dispatchEvent(new Event("offline"));
      });

      expect(result.current.get()).toBe(false);
    });
  });

  describe("unmount cleanup", () => {
    it("does not respond to events after unmount", async () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result, unmount } = renderHook(() => useOnline());

      unmount();
      await flush();

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });

      expect(result.current.get()).toBe(true);
    });
  });
});
