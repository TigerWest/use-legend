// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useSwipe } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

function createTouchEvent(
  type: string,
  options: { clientX?: number; clientY?: number } = {}
): TouchEvent {
  const touch = {
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    identifier: 0,
    target: document.body,
    pageX: 0,
    pageY: 0,
    screenX: 0,
    screenY: 0,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
  } as Touch;

  return new TouchEvent(type, {
    touches: type === "touchend" ? ([] as any) : [touch],
    changedTouches: [touch],
    targetTouches: type === "touchend" ? ([] as any) : [touch],
    bubbles: true,
    cancelable: true,
  });
}

describe("useSwipe()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns expected observables and stop function", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useSwipe(wrapEl(div)));

      expect(result.current.isSwiping$).toBeDefined();
      expect(result.current.direction$).toBeDefined();
      expect(result.current.lengthX$).toBeDefined();
      expect(result.current.lengthY$).toBeDefined();
      expect(result.current.coordsStart$).toBeDefined();
      expect(result.current.coordsEnd$).toBeDefined();
      expect(typeof result.current.stop).toBe("function");
    });

    it("initial values are correct", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useSwipe(wrapEl(div)));

      expect(result.current.isSwiping$.peek()).toBe(false);
      expect(result.current.direction$.peek()).toBe("none");
      expect(result.current.lengthX$.peek()).toBe(0);
      expect(result.current.lengthY$.peek()).toBe(0);
      expect(result.current.coordsStart$.peek()).toEqual({ x: 0, y: 0 });
      expect(result.current.coordsEnd$.peek()).toEqual({ x: 0, y: 0 });
    });
  });

  describe("swipe detection", () => {
    it("detects left swipe", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useSwipe(wrapEl(div)));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 100 }));
      });

      expect(result.current.isSwiping$.peek()).toBe(true);
      expect(result.current.direction$.peek()).toBe("left");
      expect(result.current.lengthX$.peek()).toBe(100);
    });

    it("detects right swipe", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useSwipe(wrapEl(div)));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 250, clientY: 100 }));
      });

      expect(result.current.direction$.peek()).toBe("right");
    });

    it("detects up swipe", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useSwipe(wrapEl(div)));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 200 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 100 }));
      });

      expect(result.current.direction$.peek()).toBe("up");
    });

    it("detects down swipe", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useSwipe(wrapEl(div)));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 250 }));
      });

      expect(result.current.direction$.peek()).toBe("down");
    });

    it("tracks coordsStart and coordsEnd during swipe", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useSwipe(wrapEl(div)));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 100 }));
      });

      expect(result.current.coordsStart$.peek()).toEqual({ x: 200, y: 100 });
      expect(result.current.coordsEnd$.peek()).toEqual({ x: 100, y: 100 });
    });

    it("does not trigger swipe below threshold", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useSwipe(wrapEl(div), { threshold: 100 }));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 60, clientY: 100 }));
      });

      expect(result.current.isSwiping$.peek()).toBe(false);
      expect(result.current.direction$.peek()).toBe("none");
    });
  });

  describe("callbacks", () => {
    it("calls onSwipeStart on touchstart", () => {
      const div = document.createElement("div");
      const onSwipeStart = vi.fn();
      renderHook(() => useSwipe(wrapEl(div), { onSwipeStart }));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
      });

      expect(onSwipeStart).toHaveBeenCalledOnce();
    });

    it("calls onSwipe on touchmove when swiping", () => {
      const div = document.createElement("div");
      const onSwipe = vi.fn();
      renderHook(() => useSwipe(wrapEl(div), { onSwipe }));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 100 }));
      });

      expect(onSwipe).toHaveBeenCalledOnce();
    });

    it("calls onSwipeEnd on touchend with direction", () => {
      const div = document.createElement("div");
      const onSwipeEnd = vi.fn();
      renderHook(() => useSwipe(wrapEl(div), { onSwipeEnd }));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchend", { clientX: 100, clientY: 100 }));
      });

      expect(onSwipeEnd).toHaveBeenCalledOnce();
      expect(onSwipeEnd).toHaveBeenCalledWith(expect.any(TouchEvent), "left");
    });
  });

  describe("stop and cleanup", () => {
    it("stop() removes event listeners", () => {
      const div = document.createElement("div");
      const onSwipeStart = vi.fn();
      const { result } = renderHook(() => useSwipe(wrapEl(div), { onSwipeStart }));

      act(() => {
        result.current.stop();
      });

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
      });

      expect(onSwipeStart).not.toHaveBeenCalled();
    });

    it("removes listeners on unmount", async () => {
      const div = document.createElement("div");
      const onSwipeStart = vi.fn();
      const { unmount } = renderHook(() => useSwipe(wrapEl(div), { onSwipeStart }));

      unmount();
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
      });

      expect(onSwipeStart).not.toHaveBeenCalled();
    });

    it("resets isSwiping on touchend", () => {
      const div = document.createElement("div");
      const { result } = renderHook(() => useSwipe(wrapEl(div)));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 100 }));
      });
      expect(result.current.isSwiping$.peek()).toBe(true);

      act(() => {
        div.dispatchEvent(createTouchEvent("touchend", { clientX: 100, clientY: 100 }));
      });
      expect(result.current.isSwiping$.peek()).toBe(false);
    });
  });
});
