// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useSwipe } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

afterEach(() => {
  vi.restoreAllMocks();
});

function createTouchEvent(
  type: string,
  opts: { clientX?: number; clientY?: number } = {}
): TouchEvent {
  const touch = {
    clientX: opts.clientX ?? 0,
    clientY: opts.clientY ?? 0,
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

describe("useSwipe() — edge cases", () => {
  it("movement below threshold is not a swipe", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() => useSwipe(wrapEl(div), { threshold: 100 }));

    act(() => {
      div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
      div.dispatchEvent(createTouchEvent("touchmove", { clientX: 160, clientY: 100 })); // 40px < 100
    });

    expect(result.current.isSwiping$.get()).toBe(false);
    expect(result.current.direction$.get()).toBe("none");
  });

  it("stop() prevents touch detection", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() => useSwipe(wrapEl(div), { threshold: 10 }));

    act(() => {
      result.current.stop();
    });

    act(() => {
      div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
      div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 100 }));
    });

    expect(result.current.isSwiping$.get()).toBe(false);
  });

  it("touchmove without touchstart does not update state", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() => useSwipe(wrapEl(div), { threshold: 10 }));

    // No touchstart — isTracking stays false
    act(() => {
      div.dispatchEvent(createTouchEvent("touchmove", { clientX: 50, clientY: 100 }));
    });

    expect(result.current.isSwiping$.get()).toBe(false);
    expect(result.current.direction$.get()).toBe("none");
  });

  it("null target does not throw", () => {
    expect(() => renderHook(() => useSwipe(null))).not.toThrow();
  });

  it("onSwipeStart called on touchstart, onSwipeEnd called on touchend with direction", () => {
    const div = document.createElement("div");
    const onSwipeStart = vi.fn();
    const onSwipeEnd = vi.fn();
    renderHook(() => useSwipe(wrapEl(div), { threshold: 10, onSwipeStart, onSwipeEnd }));

    act(() => {
      div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
    });
    expect(onSwipeStart).toHaveBeenCalledOnce();

    act(() => {
      div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 100 }));
      div.dispatchEvent(createTouchEvent("touchend", { clientX: 100, clientY: 100 }));
    });

    expect(onSwipeEnd).toHaveBeenCalledOnce();
    expect(onSwipeEnd.mock.calls[0][1]).toBe("left");
  });

  it("vertical swipe down detected", () => {
    const div = document.createElement("div");
    const { result } = renderHook(() => useSwipe(wrapEl(div), { threshold: 10 }));

    act(() => {
      div.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 0 }));
      // dy = 0 - 100 = -100 → "down"
      div.dispatchEvent(createTouchEvent("touchmove", { clientX: 100, clientY: 100 }));
    });

    expect(result.current.direction$.get()).toBe("down");
  });
});
