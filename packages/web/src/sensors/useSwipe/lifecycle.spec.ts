// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useSwipe } from ".";

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

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function fireSwipe(target: EventTarget, startX: number, endX: number) {
  target.dispatchEvent(createTouchEvent("touchstart", { clientX: startX, clientY: 100 }));
  target.dispatchEvent(createTouchEvent("touchmove", { clientX: endX, clientY: 100 }));
  target.dispatchEvent(createTouchEvent("touchend", { clientX: endX, clientY: 100 }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSwipe() — element lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Observable target", () => {
    it("null → element: starts detecting touch swipe", async () => {
      const target$ = observable<OpaqueObject<HTMLElement> | null>(null);
      const { result } = renderHook(() => useSwipe(target$));

      // Mount element
      const div = document.createElement("div");
      document.body.appendChild(div);
      act(() => target$.set(ObservableHint.opaque(div)));
      await act(flush);

      act(() => {
        fireSwipe(div, 200, 100);
      });

      expect(result.current.direction$.peek()).toBe("left");

      document.body.removeChild(div);
    });

    it("element → null: stops detecting touch swipe", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(div));
      const { result } = renderHook(() => useSwipe(target$));
      await act(flush);

      // Confirm it works initially
      act(() => {
        fireSwipe(div, 200, 100);
      });
      expect(result.current.direction$.peek()).toBe("left");

      // Unmount element
      act(() => target$.set(null));
      await act(flush);

      // Reset state manually by simulating a new gesture that should not register
      act(() => {
        div.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
        div.dispatchEvent(createTouchEvent("touchmove", { clientX: 10, clientY: 100 }));
      });

      // direction$ should remain unchanged (still "left" from before, or hook state unchanged)
      // The key check is isSwiping$ stays false — no new swipe detected
      expect(result.current.isSwiping$.peek()).toBe(false);

      document.body.removeChild(div);
    });

    it("full cycle: null → element → null → element works without leaks", async () => {
      const target$ = observable<OpaqueObject<HTMLElement> | null>(null);
      const { result } = renderHook(() => useSwipe(target$));

      // First mount
      const div1 = document.createElement("div");
      document.body.appendChild(div1);
      act(() => target$.set(ObservableHint.opaque(div1)));
      await act(flush);

      act(() => {
        fireSwipe(div1, 200, 100);
      });
      expect(result.current.direction$.peek()).toBe("left");

      // Unmount
      act(() => target$.set(null));
      await act(flush);

      // Second mount with new element
      const div2 = document.createElement("div");
      document.body.appendChild(div2);
      act(() => target$.set(ObservableHint.opaque(div2)));
      await act(flush);

      act(() => {
        fireSwipe(div2, 100, 250);
      });
      expect(result.current.direction$.peek()).toBe("right");

      // Old element should not trigger swipe
      act(() => {
        div1.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
        div1.dispatchEvent(createTouchEvent("touchmove", { clientX: 10, clientY: 100 }));
      });
      // direction$ should remain "right" — old element not tracked
      expect(result.current.direction$.peek()).toBe("right");

      document.body.removeChild(div1);
      document.body.removeChild(div2);
    });
  });
});
