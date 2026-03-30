// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useOnKeyStroke, useOnKeyDown, useOnKeyUp } from ".";

describe("useOnKeyStroke()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("accepts key filter and handler", () => {
      const handler = vi.fn();
      expect(() => renderHook(() => useOnKeyStroke("Enter", handler))).not.toThrow();
    });

    it("accepts handler only (all keys)", () => {
      const handler = vi.fn();
      expect(() => renderHook(() => useOnKeyStroke(handler))).not.toThrow();
    });
  });

  describe("key filtering", () => {
    it("calls handler when matching key is pressed", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyStroke("Enter", handler));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it("does not call handler for non-matching key", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyStroke("Enter", handler));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("supports array of keys", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyStroke(["Enter", "Space"], handler));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Space" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("supports true to match all keys", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyStroke(true, handler));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
      });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("supports predicate function", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyStroke((e) => e.key === "a" && e.ctrlKey, handler));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: false }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it("handler-only overload matches all keys", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyStroke(handler));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe("options", () => {
    it("supports keyup eventName", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyStroke("Enter", handler, { eventName: "keyup" }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it("dedupe ignores repeated events", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyStroke("a", handler, { dedupe: true }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", repeat: false }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", repeat: true }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", repeat: true }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe("convenience functions", () => {
    it("useOnKeyDown listens to keydown", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyDown("Enter", handler));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it("useOnKeyUp listens to keyup", () => {
      const handler = vi.fn();
      renderHook(() => useOnKeyUp("Enter", handler));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listener on unmount", async () => {
      const handler = vi.fn();
      const { unmount } = renderHook(() => useOnKeyStroke("Enter", handler));

      unmount();
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
