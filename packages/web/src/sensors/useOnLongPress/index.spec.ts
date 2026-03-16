// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useOnLongPress } from ".";

// ---------------------------------------------------------------------------
// jsdom PointerEvent polyfill
// ---------------------------------------------------------------------------
class PointerEventPolyfill extends MouseEvent {
  pointerType: string;
  pointerId: number;
  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params as MouseEventInit);
    this.pointerType = params.pointerType ?? "mouse";
    this.pointerId = params.pointerId ?? 0;
  }
}
if (typeof window !== "undefined" && !window.PointerEvent) {
  (globalThis as any).PointerEvent = PointerEventPolyfill;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTarget() {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(div));
  return { div, target$, cleanup: () => document.body.removeChild(div) };
}

function firePointerDown(target: EventTarget, x = 0, y = 0) {
  const event = new PointerEvent("pointerdown", {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function firePointerMove(target: EventTarget, x = 0, y = 0) {
  const event = new PointerEvent("pointermove", {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function firePointerUp(target: EventTarget, x = 0, y = 0) {
  const event = new PointerEvent("pointerup", {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function firePointerLeave(target: EventTarget) {
  act(() => {
    target.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true, cancelable: true }));
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useOnLongPress()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // return type
  // -------------------------------------------------------------------------

  describe("return type", () => {
    it("returns a stop function", () => {
      const { target$, cleanup } = createTarget();
      const handler = vi.fn();
      const { result } = renderHook(() => useOnLongPress(target$, handler));
      expect(typeof result.current).toBe("function");
      cleanup();
    });
  });

  // -------------------------------------------------------------------------
  // core behavior
  // -------------------------------------------------------------------------

  describe("core behavior", () => {
    it("fires handler after default delay (500ms)", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div);
      expect(handler).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(handler).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it("does not fire handler before delay completes", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(handler).not.toHaveBeenCalled();
      cleanup();
    });

    it("fires handler after custom delay", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { delay: 1000 }));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(handler).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(handler).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it("passes the PointerEvent to the handler", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler.mock.calls[0][0]).toBeInstanceOf(PointerEvent);
      cleanup();
    });

    it("clears timer on pointerup before delay", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      firePointerUp(div);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).not.toHaveBeenCalled();
      cleanup();
    });

    it("clears timer on pointerleave before delay", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      firePointerLeave(div);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).not.toHaveBeenCalled();
      cleanup();
    });
  });

  // -------------------------------------------------------------------------
  // distanceThreshold
  // -------------------------------------------------------------------------

  describe("distanceThreshold", () => {
    it("cancels timer when moving beyond default threshold (10px)", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div, 0, 0);
      firePointerMove(div, 11, 0); // distance = 11 > 10
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).not.toHaveBeenCalled();
      cleanup();
    });

    it("does not cancel when moving within threshold", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div, 0, 0);
      firePointerMove(div, 5, 5); // distance ≈ 7.07 < 10
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it("uses custom distanceThreshold", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { distanceThreshold: 50 }));

      firePointerDown(div, 0, 0);
      firePointerMove(div, 30, 0); // distance = 30 < 50
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it("cancels when exceeding custom distanceThreshold", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { distanceThreshold: 50 }));

      firePointerDown(div, 0, 0);
      firePointerMove(div, 51, 0); // distance = 51 > 50
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).not.toHaveBeenCalled();
      cleanup();
    });

    it("distanceThreshold=false disables distance checking", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { distanceThreshold: false }));

      firePointerDown(div, 0, 0);
      firePointerMove(div, 100, 100); // large move — ignored
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).toHaveBeenCalledTimes(1);
      cleanup();
    });
  });

  // -------------------------------------------------------------------------
  // onMouseUp callback
  // -------------------------------------------------------------------------

  describe("onMouseUp callback", () => {
    it("calls onMouseUp with isLongPress=true after long press", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      const onMouseUp = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { onMouseUp }));

      firePointerDown(div, 0, 0);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      firePointerUp(div, 3, 4); // distance = 5

      expect(onMouseUp).toHaveBeenCalledTimes(1);
      const [_duration, _distance, isLongPress, event] = onMouseUp.mock.calls[0];
      expect(isLongPress).toBe(true);
      expect(event).toBeInstanceOf(PointerEvent);
      cleanup();
    });

    it("onMouseUp receives numeric duration and distance", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      const onMouseUp = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { onMouseUp }));

      firePointerDown(div, 0, 0);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      firePointerUp(div, 3, 4); // distance = 5

      const [duration, distance] = onMouseUp.mock.calls[0];
      expect(typeof duration).toBe("number");
      expect(typeof distance).toBe("number");
      expect(distance).toBeCloseTo(5, 1);
      cleanup();
    });

    it("calls onMouseUp with isLongPress=false for short press", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      const onMouseUp = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { onMouseUp }));

      firePointerDown(div, 0, 0);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      firePointerUp(div, 0, 0);

      expect(onMouseUp).toHaveBeenCalledTimes(1);
      const [, , isLongPress] = onMouseUp.mock.calls[0];
      expect(isLongPress).toBe(false);
      cleanup();
    });

    it("does not throw when onMouseUp is not provided", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler));

      expect(() => {
        firePointerDown(div);
        firePointerUp(div);
      }).not.toThrow();
      cleanup();
    });

    it("does not call onMouseUp if pointerdown was never fired", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      const onMouseUp = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { onMouseUp }));

      // pointerup without prior pointerdown — posStart is undefined
      firePointerUp(div);

      expect(onMouseUp).not.toHaveBeenCalled();
      cleanup();
    });
  });

  // -------------------------------------------------------------------------
  // modifiers
  // -------------------------------------------------------------------------

  describe("modifiers", () => {
    it("modifiers.prevent calls preventDefault on pointerdown", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { modifiers: { prevent: true } }));

      const event = firePointerDown(div);
      expect(event.defaultPrevented).toBe(true);
      cleanup();
    });

    it("modifiers.stop calls stopPropagation on pointerdown", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { modifiers: { stop: true } }));

      const parentHandler = vi.fn();
      document.body.addEventListener("pointerdown", parentHandler);

      firePointerDown(div);
      // stopPropagation prevents bubbling to parent
      expect(parentHandler).not.toHaveBeenCalled();

      document.body.removeEventListener("pointerdown", parentHandler);
      cleanup();
    });

    it("modifiers.self ignores events from child elements", () => {
      const { div, target$, cleanup } = createTarget();
      const child = document.createElement("span");
      div.appendChild(child);

      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { modifiers: { self: true } }));

      // Event originates from child — ev.target !== div, so hook should bail
      firePointerDown(child);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).not.toHaveBeenCalled();
      cleanup();
    });

    it("modifiers.self fires when event target is the element itself", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      renderHook(() => useOnLongPress(target$, handler, { modifiers: { self: true } }));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).toHaveBeenCalledTimes(1);
      cleanup();
    });
  });

  // -------------------------------------------------------------------------
  // stop function
  // -------------------------------------------------------------------------

  describe("stop function", () => {
    it("stop() prevents handler from firing after call", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      const { result } = renderHook(() => useOnLongPress(target$, handler));

      act(() => {
        result.current(); // remove listeners
      });

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).not.toHaveBeenCalled();
      cleanup();
    });

    it("stop() clears an in-progress timer", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      const { result } = renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(200);
      });

      act(() => {
        result.current(); // stop while timer is running
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).not.toHaveBeenCalled();
      cleanup();
    });
  });

  // -------------------------------------------------------------------------
  // unmount cleanup
  // -------------------------------------------------------------------------

  describe("unmount cleanup", () => {
    it("stop() clears timer — handler does not fire after stop even past the delay", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      const { result, unmount } = renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Explicitly stop (simulating what a cleanup effect would do)
      act(() => {
        result.current();
      });

      unmount();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).not.toHaveBeenCalled();
      cleanup();
    });

    it("does not throw on unmount while a timer is pending", () => {
      const { div, target$, cleanup } = createTarget();
      const handler = vi.fn();
      const { unmount } = renderHook(() => useOnLongPress(target$, handler));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(() => unmount()).not.toThrow();
      cleanup();
    });
  });
});
