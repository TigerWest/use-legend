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

/**
 * Create a div whose getBoundingClientRect() returns the given rect.
 * Defaults: left=0, top=0, right=100, bottom=100, width=100, height=100
 */
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
// useDraggable tests
// ---------------------------------------------------------------------------

describe("useDraggable()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initialValue sets initial x$, y$, style$", () => {
    const div = createDiv();
    const { result } = renderHook(() =>
      useDraggable(wrapEl(div), { initialValue: { x: 200, y: 150 } })
    );

    expect(result.current.x$.get()).toBe(200);
    expect(result.current.y$.get()).toBe(150);
    expect(result.current.style$.get()).toBe("left: 200px; top: 150px;");
  });

  it("axis 'x' — y stays at initialValue", () => {
    const div = createDiv({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 });
    const { result } = renderHook(() =>
      useDraggable(wrapEl(div), { axis: "x", initialValue: { x: 0, y: 0 } })
    );

    firePointerDown(div, 10, 10);
    firePointerMove(60, 80);

    expect(result.current.x$.get()).toBe(50); // moved
    expect(result.current.y$.get()).toBe(0); // frozen
  });

  it("axis 'y' — x stays at initialValue", () => {
    const div = createDiv({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 });
    const { result } = renderHook(() =>
      useDraggable(wrapEl(div), { axis: "y", initialValue: { x: 0, y: 0 } })
    );

    firePointerDown(div, 10, 10);
    firePointerMove(60, 80);

    expect(result.current.x$.get()).toBe(0); // frozen
    expect(result.current.y$.get()).toBe(70); // moved
  });

  it("disabled: true — pointerdown is ignored", () => {
    const div = createDiv();
    const { result } = renderHook(() => useDraggable(wrapEl(div), { disabled: true }));

    firePointerDown(div, 10, 10);
    firePointerMove(60, 80);

    expect(result.current.x$.get()).toBe(0);
    expect(result.current.y$.get()).toBe(0);
    expect(result.current.isDragging$.get()).toBe(false);
  });

  it("disabled Observable — second drag is blocked after set(true)", () => {
    const div = createDiv();
    const disabled$ = observable(false);
    const { result } = renderHook(() => useDraggable(wrapEl(div), { disabled: disabled$ }));

    // First drag — should work
    firePointerDown(div, 10, 10);
    firePointerMove(60, 80);
    firePointerUp();
    expect(result.current.isDragging$.get()).toBe(false);
    const xAfterFirst = result.current.x$.get();
    expect(xAfterFirst).toBe(50);

    // Disable
    act(() => disabled$.set(true));

    // Second drag — should be blocked
    firePointerDown(div, 10, 10);
    firePointerMove(100, 100);

    expect(result.current.isDragging$.get()).toBe(false);
    expect(result.current.x$.get()).toBe(xAfterFirst); // unchanged
  });

  it("x$.set() / y$.set() reactively updates style$ and position$", () => {
    const div = createDiv();
    const { result } = renderHook(() => useDraggable(wrapEl(div)));

    act(() => {
      result.current.x$.set(50);
      result.current.y$.set(75);
    });

    expect(result.current.style$.get()).toBe("left: 50px; top: 75px;");
    expect(result.current.position$.get()).toEqual({ x: 50, y: 75 });
  });

  it("does not throw when target is null", () => {
    expect(() => {
      renderHook(() => useDraggable(null));
    }).not.toThrow();
  });

  it("pointermove without pointerdown does not change state", () => {
    const div = createDiv();
    const { result } = renderHook(() => useDraggable(wrapEl(div)));

    firePointerMove(100, 100);

    expect(result.current.x$.get()).toBe(0);
    expect(result.current.y$.get()).toBe(0);
    expect(result.current.isDragging$.get()).toBe(false);
  });
});
