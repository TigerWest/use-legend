// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useNavigatorLanguage } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useNavigatorLanguage()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns observable fields", () => {
      const { result } = renderHook(() => useNavigatorLanguage());
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.language$.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when navigator.language exists", () => {
      const { result } = renderHook(() => useNavigatorLanguage());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("language$ reflects navigator.language", () => {
      vi.spyOn(navigator, "language", "get").mockReturnValue("ko-KR");
      const { result } = renderHook(() => useNavigatorLanguage());
      expect(result.current.language$.get()).toBe("ko-KR");
    });
  });

  describe("languagechange event", () => {
    it("updates language$ on languagechange event", () => {
      vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
      const { result } = renderHook(() => useNavigatorLanguage());
      expect(result.current.language$.get()).toBe("en-US");

      act(() => {
        vi.spyOn(navigator, "language", "get").mockReturnValue("ja-JP");
        window.dispatchEvent(new Event("languagechange"));
      });

      expect(result.current.language$.get()).toBe("ja-JP");
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listener on unmount", async () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useNavigatorLanguage());
      unmount();
      await flush();

      const added = addSpy.mock.calls.some(([type]) => type === "languagechange");
      const removed = removeSpy.mock.calls.some(([type]) => type === "languagechange");
      expect(added).toBe(true);
      expect(removed).toBe(true);
    });
  });
});
