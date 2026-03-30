// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useOnStartTyping } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useOnStartTyping()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("accepts callback without error", () => {
      expect(() => renderHook(() => useOnStartTyping(vi.fn()))).not.toThrow();
    });
  });

  describe("typing detection", () => {
    it("calls callback when typing on non-editable element", () => {
      const handler = vi.fn();
      renderHook(() => useOnStartTyping(handler));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it("calls callback for number keys", () => {
      const handler = vi.fn();
      renderHook(() => useOnStartTyping(handler));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "5" }));
      });

      expect(handler).toHaveBeenCalledOnce();
    });

    it("does not call callback for modifier key combos", () => {
      const handler = vi.fn();
      renderHook(() => useOnStartTyping(handler));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a", metaKey: true }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a", altKey: true }));
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("does not call callback for non-character keys", () => {
      const handler = vi.fn();
      renderHook(() => useOnStartTyping(handler));

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Control" }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("does not call callback when input is focused", () => {
      const handler = vi.fn();
      renderHook(() => useOnStartTyping(handler));

      const input = document.createElement("input");
      input.type = "text";
      document.body.appendChild(input);
      input.focus();

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it("does not call callback when textarea is focused", () => {
      const handler = vi.fn();
      renderHook(() => useOnStartTyping(handler));

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.focus();

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it("does not call callback when contenteditable is focused", () => {
      const handler = vi.fn();
      renderHook(() => useOnStartTyping(handler));

      const div = document.createElement("div");
      div.contentEditable = "true";
      div.tabIndex = 0;
      document.body.appendChild(div);
      div.focus();

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });

    it("calls callback when non-editable input type is focused", () => {
      const handler = vi.fn();
      renderHook(() => useOnStartTyping(handler));

      const input = document.createElement("input");
      input.type = "checkbox";
      document.body.appendChild(input);
      input.focus();

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(handler).toHaveBeenCalledOnce();

      document.body.removeChild(input);
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listener on unmount", async () => {
      const handler = vi.fn();
      const { unmount } = renderHook(() => useOnStartTyping(handler));

      unmount();
      await flush();

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
