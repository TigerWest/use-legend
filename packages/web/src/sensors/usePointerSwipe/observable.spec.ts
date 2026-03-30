// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { usePointerSwipe } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

// Polyfill PointerEvent for jsdom
if (typeof PointerEvent === "undefined") {
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: any = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firePointerDown(target: EventTarget, x = 0, y = 0, pointerType = "mouse") {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: x,
        clientY: y,
        buttons: 1,
        bubbles: true,
        pointerType,
      })
    );
  });
}

function firePointerMove(target: EventTarget, x = 0, y = 0, pointerType = "mouse") {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: x,
        clientY: y,
        buttons: 1,
        bubbles: true,
        pointerType,
      })
    );
  });
}

function firePointerUp(target: EventTarget, x = 0, y = 0, pointerType = "mouse") {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX: x,
        clientY: y,
        buttons: 0,
        bubbles: true,
        pointerType,
      })
    );
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePointerSwipe() — reactive options", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Observable option change", () => {
    it("threshold change affects swipe detection", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      const threshold$ = observable(100);

      const { result } = renderHook(() => usePointerSwipe(wrapEl(div), { threshold: threshold$ }));

      // Move 60px right — below threshold of 100, should be "none"
      firePointerDown(div, 0, 0);
      firePointerMove(div, 60, 0);
      expect(result.current.direction$.get()).toBe("none");
      expect(result.current.isSwiping$.get()).toBe(false);
      firePointerUp(div, 60, 0);

      // Lower threshold to 10 — same 60px move should now detect direction
      act(() => threshold$.set(10));

      firePointerDown(div, 0, 0);
      firePointerMove(div, 60, 0);
      // dx = 0 - 60 = -60 → "right"
      expect(result.current.direction$.get()).toBe("right");
      expect(result.current.isSwiping$.get()).toBe(true);
      firePointerUp(div, 60, 0);

      document.body.removeChild(div);
    });

    it("pointerTypes change filters events", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      const pointerTypes$ = observable<Array<"mouse" | "touch" | "pen">>(["touch"]);

      const { result } = renderHook(() =>
        usePointerSwipe(wrapEl(div), { threshold: 30, pointerTypes: pointerTypes$ })
      );

      // Mouse event should NOT trigger when pointerTypes is ["touch"]
      firePointerDown(div, 0, 0, "mouse");
      firePointerMove(div, 60, 0, "mouse");
      expect(result.current.direction$.get()).toBe("none");
      expect(result.current.isSwiping$.get()).toBe(false);
      firePointerUp(div, 60, 0, "mouse");

      // Change pointerTypes to include "mouse"
      act(() => pointerTypes$.set(["mouse"]));

      // Mouse event should now trigger
      firePointerDown(div, 0, 0, "mouse");
      firePointerMove(div, 60, 0, "mouse");
      expect(result.current.direction$.get()).toBe("right");
      expect(result.current.isSwiping$.get()).toBe(true);
      firePointerUp(div, 60, 0, "mouse");

      document.body.removeChild(div);
    });
  });

  describe("per-field Observable", () => {
    it("per-field threshold$ change reflects in direction computation", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      const threshold$ = observable(100);

      const { result } = renderHook(() => usePointerSwipe(wrapEl(div), { threshold: threshold$ }));

      // 60px move — below threshold=100, direction stays "none"
      firePointerDown(div, 0, 0);
      firePointerMove(div, 60, 0);
      expect(result.current.direction$.get()).toBe("none");
      firePointerUp(div, 60, 0);

      // Lower per-field threshold to 10
      act(() => threshold$.set(10));

      // Same 60px move — now above threshold=10, direction detected
      firePointerDown(div, 0, 0);
      firePointerMove(div, 60, 0);
      // dx = 0 - 60 = -60 → abs(dx)=60 > abs(dy)=0 → dx < 0 → "right"
      expect(result.current.direction$.get()).toBe("right");
      expect(result.current.isSwiping$.get()).toBe(true);
      firePointerUp(div, 60, 0);

      document.body.removeChild(div);
    });
  });
});
