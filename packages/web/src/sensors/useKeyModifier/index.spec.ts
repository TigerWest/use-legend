// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useKeyModifier } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useKeyModifier()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns an observable with .get", () => {
      const { result } = renderHook(() => useKeyModifier("Shift"));
      expect(typeof result.current.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("defaults to null", () => {
      const { result } = renderHook(() => useKeyModifier("Shift"));
      expect(result.current.get()).toBeNull();
    });

    it("uses initial option if provided", () => {
      const { result } = renderHook(() => useKeyModifier("Shift", { initial: false }));
      expect(result.current.get()).toBe(false);
    });
  });

  describe("modifier detection", () => {
    it("detects Shift key on keydown", () => {
      const { result } = renderHook(() => useKeyModifier("Shift"));

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "Shift" });
        Object.defineProperty(event, "getModifierState", {
          value: (mod: string) => mod === "Shift",
        });
        window.dispatchEvent(event);
      });

      expect(result.current.get()).toBe(true);
    });

    it("detects Shift release on keyup", () => {
      const { result } = renderHook(() => useKeyModifier("Shift"));

      // Press
      act(() => {
        const event = new KeyboardEvent("keydown", { key: "Shift" });
        Object.defineProperty(event, "getModifierState", {
          value: (mod: string) => mod === "Shift",
        });
        window.dispatchEvent(event);
      });
      expect(result.current.get()).toBe(true);

      // Release
      act(() => {
        const event = new KeyboardEvent("keyup", { key: "Shift" });
        Object.defineProperty(event, "getModifierState", {
          value: () => false,
        });
        window.dispatchEvent(event);
      });
      expect(result.current.get()).toBe(false);
    });

    it("detects Control key on mousedown", () => {
      const { result } = renderHook(() => useKeyModifier("Control"));

      act(() => {
        const event = new MouseEvent("mousedown", { ctrlKey: true });
        Object.defineProperty(event, "getModifierState", {
          value: (mod: string) => mod === "Control",
        });
        window.dispatchEvent(event);
      });

      expect(result.current.get()).toBe(true);
    });

    it("tracks CapsLock", () => {
      const { result } = renderHook(() => useKeyModifier("CapsLock"));

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "CapsLock" });
        Object.defineProperty(event, "getModifierState", {
          value: (mod: string) => mod === "CapsLock",
        });
        window.dispatchEvent(event);
      });

      expect(result.current.get()).toBe(true);
    });
  });

  describe("custom events", () => {
    it("listens only to specified events", () => {
      const { result } = renderHook(() => useKeyModifier("Shift", { events: ["keydown"] }));

      // mousedown should NOT trigger update
      act(() => {
        const event = new MouseEvent("mousedown");
        Object.defineProperty(event, "getModifierState", {
          value: () => true,
        });
        window.dispatchEvent(event);
      });
      expect(result.current.get()).toBeNull();

      // keydown should trigger update
      act(() => {
        const event = new KeyboardEvent("keydown", { key: "Shift" });
        Object.defineProperty(event, "getModifierState", {
          value: () => true,
        });
        window.dispatchEvent(event);
      });
      expect(result.current.get()).toBe(true);
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listeners on unmount", async () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useKeyModifier("Shift"));

      unmount();
      await flush();

      const addedKeydown = addSpy.mock.calls.some(([type]) => type === "keydown");
      const removedKeydown = removeSpy.mock.calls.some(([type]) => type === "keydown");
      expect(addedKeydown).toBe(true);
      expect(removedKeydown).toBe(true);
    });
  });
});
