// @vitest-environment jsdom
import { useState } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useOnKeyStroke } from ".";

describe("useOnKeyStroke() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register listener on re-render", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const handler = vi.fn();

      const { result } = renderHook(() => {
        const [, setState] = useState(0);
        useOnKeyStroke("Enter", handler);
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
    it("uses latest handler after re-render", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      let currentHandler = handler1;

      const { rerender } = renderHook(() => {
        useOnKeyStroke("Enter", currentHandler);
      });

      currentHandler = handler2;
      rerender();

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });
  });
});
