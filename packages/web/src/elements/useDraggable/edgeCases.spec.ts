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

const wrapEl = (el: Element) =>
  observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

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
// useDraggable — edge cases
// ---------------------------------------------------------------------------

describe("useDraggable() — edge cases", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("SVG element target is supported", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
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

    const target$ = observable<OpaqueObject<Element> | null>(
      ObservableHint.opaque(svg)
    );

    expect(() => {
      renderHook(() => useDraggable(target$ as any));
    }).not.toThrow();

    let result: ReturnType<typeof renderHook<ReturnType<typeof useDraggable>>>;

    act(() => {
      result = renderHook(() => useDraggable(target$ as any));
    });

    // Verify SVG element accepts pointerdown and updates state
    firePointerDown(svg, 10, 10);
    firePointerMove(50, 60);

    expect(result!.result.current.isDragging$.get()).toBe(true);
    expect(result!.result.current.x$.get()).toBe(40);
    expect(result!.result.current.y$.get()).toBe(50);
  });

  it("rapid pointerdown/pointerup does not leave isDragging$ stuck as true", () => {
    const div = createDiv();
    const { result } = renderHook(() => useDraggable(wrapEl(div)));

    // Fire many rapid pointerdown + pointerup pairs
    for (let i = 0; i < 5; i++) {
      firePointerDown(div, 10, 10);
      firePointerUp(10, 10);
    }

    // After all rapid interactions, isDragging$ must be false
    expect(result.current.isDragging$.get()).toBe(false);
  });
});
