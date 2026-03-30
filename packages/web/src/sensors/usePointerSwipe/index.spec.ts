// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { usePointerSwipe } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

// jsdom doesn't have PointerEvent, stub it
beforeEach(() => {
  if (!globalThis.PointerEvent) {
    vi.stubGlobal(
      "PointerEvent",
      class extends MouseEvent {
        pointerId: number;
        pointerType: string;
        constructor(type: string, init: any = {}) {
          super(type, init);
          this.pointerId = init.pointerId ?? 0;
          this.pointerType = init.pointerType ?? "mouse";
        }
      }
    );
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("usePointerSwipe()", () => {
  describe("return shape", () => {
    it("returns observable fields and stop function", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => usePointerSwipe(wrapEl(el)));
      expect(typeof result.current.isSwiping$.get).toBe("function");
      expect(typeof result.current.direction$.get).toBe("function");
      expect(typeof result.current.distanceX$.get).toBe("function");
      expect(typeof result.current.distanceY$.get).toBe("function");
      expect(typeof result.current.posStart$.get).toBe("function");
      expect(typeof result.current.posEnd$.get).toBe("function");
      expect(typeof result.current.stop).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSwiping$ is false initially", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => usePointerSwipe(wrapEl(el)));
      expect(result.current.isSwiping$.get()).toBe(false);
    });

    it("direction$ is 'none' initially", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => usePointerSwipe(wrapEl(el)));
      expect(result.current.direction$.get()).toBe("none");
    });
  });

  describe("swipe detection", () => {
    it("detects horizontal swipe left", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const onSwipeEnd = vi.fn();
      const { result } = renderHook(() =>
        usePointerSwipe(wrapEl(el), { threshold: 10, onSwipeEnd })
      );

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 100, clientY: 100, buttons: 1 })
        );
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 40, clientY: 100, buttons: 1 })
        );
        el.dispatchEvent(new PointerEvent("pointerup", { clientX: 40, clientY: 100, buttons: 0 }));
      });

      expect(result.current.direction$.get()).toBe("left");
      expect(onSwipeEnd).toHaveBeenCalled();

      document.body.removeChild(el);
    });

    it("detects vertical swipe up", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const { result } = renderHook(() => usePointerSwipe(wrapEl(el), { threshold: 10 }));

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 100, clientY: 200, buttons: 1 })
        );
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 100, clientY: 100, buttons: 1 })
        );
        el.dispatchEvent(new PointerEvent("pointerup", { clientX: 100, clientY: 100, buttons: 0 }));
      });

      expect(result.current.direction$.get()).toBe("up");

      document.body.removeChild(el);
    });

    it("does not trigger swipe below threshold", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const { result } = renderHook(() => usePointerSwipe(wrapEl(el), { threshold: 100 }));

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 100, clientY: 100, buttons: 1 })
        );
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 80, clientY: 100, buttons: 1 })
        );
        el.dispatchEvent(new PointerEvent("pointerup", { clientX: 80, clientY: 100, buttons: 0 }));
      });

      expect(result.current.isSwiping$.get()).toBe(false);
      expect(result.current.direction$.get()).toBe("none");

      document.body.removeChild(el);
    });

    it("calls onSwipeStart callback", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const onSwipeStart = vi.fn();
      renderHook(() => usePointerSwipe(wrapEl(el), { onSwipeStart }));

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 100, clientY: 100, buttons: 1 })
        );
      });

      expect(onSwipeStart).toHaveBeenCalledOnce();

      document.body.removeChild(el);
    });

    it("updates distance values during swipe", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      const { result } = renderHook(() => usePointerSwipe(wrapEl(el), { threshold: 10 }));

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 100, clientY: 100, buttons: 1 })
        );
        el.dispatchEvent(new PointerEvent("pointermove", { clientX: 50, clientY: 80, buttons: 1 }));
      });

      expect(result.current.distanceX$.get()).toBe(50);
      expect(result.current.distanceY$.get()).toBe(20);

      document.body.removeChild(el);
    });
  });

  describe("cleanup", () => {
    it("accepts null target without error", () => {
      expect(() => renderHook(() => usePointerSwipe(null))).not.toThrow();
    });
  });
});
