// @vitest-environment jsdom
import { useState } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useOnStartTyping } from ".";

describe("useOnStartTyping() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register listener on re-render", () => {
      const addSpy = vi.spyOn(document, "addEventListener");
      const handler = vi.fn();

      const { result } = renderHook(() => {
        const [, setState] = useState(0);
        useOnStartTyping(handler);
        return { triggerRerender: () => setState((v) => v + 1) };
      });

      const addCountBefore = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;

      act(() => {
        result.current.triggerRerender();
      });

      const addCountAfter = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;
      expect(addCountAfter).toBe(addCountBefore);
    });
  });

  describe("callback freshness", () => {
    it("uses latest callback after re-render", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      let currentHandler = handler1;

      const { rerender } = renderHook(() => {
        useOnStartTyping(currentHandler);
      });

      currentHandler = handler2;
      rerender();

      act(() => {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });
  });
});
