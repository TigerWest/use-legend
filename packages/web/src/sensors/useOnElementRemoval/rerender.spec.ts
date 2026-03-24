// @vitest-environment jsdom
import { useState } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useOnElementRemoval } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const waitForMutation = () => new Promise<void>((resolve) => setTimeout(resolve, 10));

describe("useOnElementRemoval() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-create observer on re-render", () => {
      const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
      const el = document.createElement("div");

      const { result } = renderHook(() => {
        const [, setState] = useState(0);
        useOnElementRemoval(wrapEl(el), vi.fn());
        return { triggerRerender: () => setState((v) => v + 1) };
      });

      const countBefore = observeSpy.mock.calls.length;

      act(() => {
        result.current.triggerRerender();
      });

      expect(observeSpy.mock.calls.length).toBe(countBefore);
    });
  });

  describe("callback freshness", () => {
    it("uses latest callback after re-render", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      let currentHandler = handler1;

      const el = document.createElement("div");
      document.body.appendChild(el);

      const { rerender } = renderHook(() => {
        useOnElementRemoval(wrapEl(el), currentHandler);
      });

      await waitForMutation();

      currentHandler = handler2;
      rerender();

      act(() => {
        document.body.removeChild(el);
      });

      await waitForMutation();

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });
  });
});
