// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useMagicKeys } from ".";

describe("useMagicKeys() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register listeners on re-render", () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(() => useMagicKeys());

      const countBefore = addSpy.mock.calls.filter(
        (c) => c[0] === "keydown" || c[0] === "keyup" || c[0] === "blur"
      ).length;

      rerender();

      const countAfter = addSpy.mock.calls.filter(
        (c) => c[0] === "keydown" || c[0] === "keyup" || c[0] === "blur"
      ).length;

      expect(countAfter).toBe(countBefore);
    });
  });

  describe("value accuracy", () => {
    it("returns the same proxy across re-renders", () => {
      const { result, rerender } = renderHook(() => useMagicKeys());

      const first = result.current;
      rerender();

      expect(result.current).toBe(first);
    });

    it("current$ reference is stable across re-renders", () => {
      const { result, rerender } = renderHook(() => useMagicKeys());

      const first = result.current.current$;
      rerender();

      expect(result.current.current$).toBe(first);
    });

    it("key observable reference is stable across re-renders", () => {
      const { result, rerender } = renderHook(() => useMagicKeys());

      const aObs = result.current["a"];
      rerender();

      expect(result.current["a"]).toBe(aObs);
    });

    it("key state is preserved after re-render", () => {
      const { result, rerender } = renderHook(() => useMagicKeys());

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(result.current["a"].peek()).toBe(true);

      rerender();

      expect(result.current["a"].peek()).toBe(true);
    });
  });

  describe("callback freshness", () => {
    it("uses latest onEventFired after re-render", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      let currentHandler = handler1;

      const { rerender } = renderHook(() => useMagicKeys({ onEventFired: currentHandler }));

      currentHandler = handler2;
      rerender();

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });
  });
});
