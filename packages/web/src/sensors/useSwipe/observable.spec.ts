// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useSwipe } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSwipe() — reactive options", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Observable option change", () => {
    it("threshold change affects swipe detection", () => {
      const div = document.createElement("div");
      const threshold$ = observable(100);
      const { result } = renderHook(() => useSwipe(wrapEl(div), { threshold: threshold$ }));

      // Swipe 60px — below threshold of 100 → no detection
      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 140, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchend", { clientX: 140, clientY: 100 }));
      });

      expect(result.current.direction$.peek()).toBe("none");
      expect(result.current.isSwiping$.peek()).toBe(false);

      // Lower threshold to 10 — same 60px swipe should now be detected
      act(() => threshold$.set(10));

      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 200, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 140, clientY: 100 }));
      });

      expect(result.current.direction$.peek()).toBe("left");
      expect(result.current.isSwiping$.peek()).toBe(true);
    });
  });
});
