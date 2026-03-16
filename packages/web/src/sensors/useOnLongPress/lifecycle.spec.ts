// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useOnLongPress } from ".";

// Polyfill PointerEvent for jsdom
if (typeof PointerEvent === "undefined") {
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
      Object.defineProperty(this, "pointerId", { value: init?.pointerId ?? 0, enumerable: true });
      Object.defineProperty(this, "width", { value: init?.width ?? 0, enumerable: true });
      Object.defineProperty(this, "height", { value: init?.height ?? 0, enumerable: true });
      Object.defineProperty(this, "pressure", { value: init?.pressure ?? 0, enumerable: true });
      Object.defineProperty(this, "tangentialPressure", {
        value: init?.tangentialPressure ?? 0,
        enumerable: true,
      });
      Object.defineProperty(this, "tiltX", { value: init?.tiltX ?? 0, enumerable: true });
      Object.defineProperty(this, "tiltY", { value: init?.tiltY ?? 0, enumerable: true });
      Object.defineProperty(this, "twist", { value: init?.twist ?? 0, enumerable: true });
      Object.defineProperty(this, "pointerType", {
        value: init?.pointerType ?? "mouse",
        enumerable: true,
      });
      Object.defineProperty(this, "isPrimary", {
        value: init?.isPrimary ?? false,
        enumerable: true,
      });
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firePointerDown(target: EventTarget, x = 0, y = 0) {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: x, clientY: y })
    );
  });
}

function firePointerUp(target: EventTarget) {
  act(() => {
    target.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true }));
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useOnLongPress() — element lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Observable target", () => {
    it("null → element: starts detecting long press", () => {
      const target$ = observable<OpaqueObject<HTMLElement> | null>(null);
      const handler = vi.fn();

      renderHook(() => useOnLongPress(target$, handler));

      // Mount element
      const div = document.createElement("div");
      document.body.appendChild(div);
      act(() => target$.set(ObservableHint.opaque(div)));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).toHaveBeenCalledTimes(1);
      document.body.removeChild(div);
    });

    it("element → null: stops detecting long press", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(div));
      const handler = vi.fn();

      renderHook(() => useOnLongPress(target$, handler));

      // Unmount element
      act(() => target$.set(null));

      firePointerDown(div);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(handler).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it("full cycle: null → element → null → element works without leaks", () => {
      const target$ = observable<OpaqueObject<HTMLElement> | null>(null);
      const handler = vi.fn();

      renderHook(() => useOnLongPress(target$, handler));

      // First mount
      const div1 = document.createElement("div");
      document.body.appendChild(div1);
      act(() => target$.set(ObservableHint.opaque(div1)));

      firePointerDown(div1);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(handler).toHaveBeenCalledTimes(1);
      firePointerUp(div1);
      handler.mockClear();

      // Unmount
      act(() => target$.set(null));

      // Second mount
      const div2 = document.createElement("div");
      document.body.appendChild(div2);
      act(() => target$.set(ObservableHint.opaque(div2)));

      firePointerDown(div2);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(handler).toHaveBeenCalledTimes(1);

      // Old element should not trigger
      handler.mockClear();
      firePointerDown(div1);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(div1);
      document.body.removeChild(div2);
    });
  });
});
