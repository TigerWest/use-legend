// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDraggable } from ".";

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

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

function createDiv(rect: Partial<DOMRect> = {}) {
  const div = document.createElement("div");
  const full: DOMRect = {
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  };
  vi.spyOn(div, "getBoundingClientRect").mockReturnValue(full);
  return div;
}

function firePointerDown(
  target: EventTarget,
  clientX: number,
  clientY: number,
  pointerType = "mouse"
) {
  act(() => {
    target.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX,
        clientY,
        pointerType,
        bubbles: true,
        cancelable: true,
      })
    );
  });
}

function firePointerMove(clientX: number, clientY: number) {
  act(() => {
    window.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX,
        clientY,
        bubbles: true,
        cancelable: true,
      })
    );
  });
}

function firePointerUp(clientX = 0, clientY = 0) {
  act(() => {
    window.dispatchEvent(
      new PointerEvent("pointerup", {
        clientX,
        clientY,
        bubbles: true,
      })
    );
  });
}

// ---------------------------------------------------------------------------
// useDraggable — reactive options
// ---------------------------------------------------------------------------

describe("useDraggable() — reactive options", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Observable option change", () => {
    it("disabled Observable set(true) blocks subsequent drags", () => {
      const div = createDiv();
      const disabled$ = observable(false);
      const { result } = renderHook(() => useDraggable(wrapEl(div), { disabled: disabled$ }));

      // First drag — should work
      firePointerDown(div, 0, 0);
      firePointerMove(50, 50);
      firePointerUp();

      expect(result.current.x$.get()).toBe(50);
      expect(result.current.isDragging$.get()).toBe(false);

      // Disable
      act(() => disabled$.set(true));

      // Second drag — should be blocked
      firePointerDown(div, 0, 0);
      firePointerMove(100, 100);

      expect(result.current.isDragging$.get()).toBe(false);
      expect(result.current.x$.get()).toBe(50); // unchanged
    });

    it("disabled Observable set(false) re-enables dragging", () => {
      const div = createDiv();
      const disabled$ = observable(true);
      const { result } = renderHook(() => useDraggable(wrapEl(div), { disabled: disabled$ }));

      // Initially disabled — drag blocked
      firePointerDown(div, 0, 0);
      firePointerMove(50, 50);
      expect(result.current.isDragging$.get()).toBe(false);
      expect(result.current.x$.get()).toBe(0);

      // Re-enable
      act(() => disabled$.set(false));

      // Drag should now work
      firePointerDown(div, 0, 0);
      firePointerMove(30, 30);

      expect(result.current.isDragging$.get()).toBe(true);
      expect(result.current.x$.get()).toBe(30);
    });

    it('Observable axis change from "both" to "x" restricts movement to x only', () => {
      const div = createDiv();
      const axis$ = observable<"x" | "y" | "both">("both");
      const { result } = renderHook(() => useDraggable(wrapEl(div), { axis: axis$ }));

      // With axis "both" — both x and y move freely
      firePointerDown(div, 0, 0);
      firePointerMove(40, 30);
      expect(result.current.x$.get()).toBe(40);
      expect(result.current.y$.get()).toBe(30);
      firePointerUp();

      // Reset position
      act(() => {
        result.current.x$.set(0);
        result.current.y$.set(0);
      });

      // Change axis to "x" — y should be frozen
      act(() => axis$.set("x"));

      firePointerDown(div, 0, 0);
      firePointerMove(60, 50);

      expect(result.current.x$.get()).toBe(60); // moved
      expect(result.current.y$.get()).toBe(0); // frozen at current y value
    });
  });

  describe("Observable target switch", () => {
    it("Observable containerElement change clamps drag to new container", () => {
      const div = createDiv({ left: 0, top: 0, width: 50, height: 50, right: 50, bottom: 50 });

      // Large container — no clamping
      const container1 = document.createElement("div");
      vi.spyOn(container1, "getBoundingClientRect").mockReturnValue({
        left: 0,
        top: 0,
        right: 1000,
        bottom: 1000,
        width: 1000,
        height: 1000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Small container — clamps to 100px
      const container2 = document.createElement("div");
      vi.spyOn(container2, "getBoundingClientRect").mockReturnValue({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const container$ = observable<OpaqueObject<Element> | null>(
        ObservableHint.opaque(container1)
      );

      const { result } = renderHook(() =>
        useDraggable(wrapEl(div), { containerElement: container$ as any })
      );

      // Drag with large container — x/y can go to 300
      firePointerDown(div, 0, 0);
      firePointerMove(300, 300);
      expect(result.current.x$.get()).toBe(300);
      expect(result.current.y$.get()).toBe(300);
      firePointerUp();

      // Reset position
      act(() => {
        result.current.x$.set(0);
        result.current.y$.set(0);
      });

      // Switch to small container
      act(() => container$.set(ObservableHint.opaque(container2)));

      // Drag again — should be clamped to container2 bounds (right=100, el.width=50 → max=50)
      firePointerDown(div, 0, 0);
      firePointerMove(300, 300);

      expect(result.current.x$.get()).toBeLessThanOrEqual(50);
      expect(result.current.y$.get()).toBeLessThanOrEqual(50);
    });
  });
});
