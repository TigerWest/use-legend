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
// useDraggable — rerender stability
// ---------------------------------------------------------------------------

describe("useDraggable() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register pointer event listeners when unrelated state causes re-render", () => {
      const div = createDiv();
      const addSpy = vi.spyOn(div, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDraggable(wrapEl(div));
        },
        { initialProps: { count: 0 } }
      );

      const callCountAfterMount = addSpy.mock.calls.length;

      rerender({ count: 1 });
      rerender({ count: 2 });

      // pointerdown on the element must not be re-registered after re-renders
      expect(addSpy.mock.calls.length).toBe(callCountAfterMount);
    });

    it("window pointermove listener is not re-registered on re-render", () => {
      const div = createDiv();
      const winAddSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDraggable(wrapEl(div));
        },
        { initialProps: { count: 0 } }
      );

      const moveCalls = winAddSpy.mock.calls.filter((c) => c[0] === "pointermove").length;

      rerender({ count: 1 });
      rerender({ count: 2 });

      const moveCallsAfter = winAddSpy.mock.calls.filter((c) => c[0] === "pointermove").length;
      expect(moveCallsAfter).toBe(moveCalls);
    });

    it("window pointerup listener is not re-registered on re-render", () => {
      const div = createDiv();
      const winAddSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDraggable(wrapEl(div));
        },
        { initialProps: { count: 0 } }
      );

      const upCalls = winAddSpy.mock.calls.filter((c) => c[0] === "pointerup").length;

      rerender({ count: 1 });
      rerender({ count: 2 });

      const upCallsAfter = winAddSpy.mock.calls.filter((c) => c[0] === "pointerup").length;
      expect(upCallsAfter).toBe(upCalls);
    });
  });

  describe("value accuracy", () => {
    it("x$, y$, isDragging$ remain accurate after re-render", () => {
      const div = createDiv();

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDraggable(wrapEl(div));
        },
        { initialProps: { count: 0 } }
      );

      firePointerDown(div, 10, 10);
      firePointerMove(60, 80);

      expect(result.current.x$.get()).toBe(50);
      expect(result.current.y$.get()).toBe(70);
      expect(result.current.isDragging$.get()).toBe(true);

      rerender({ count: 1 });

      expect(result.current.x$.get()).toBe(50);
      expect(result.current.y$.get()).toBe(70);
      expect(result.current.isDragging$.get()).toBe(true);
    });

    it("style$ and position$ are preserved after re-render", () => {
      const div = createDiv();

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDraggable(wrapEl(div));
        },
        { initialProps: { count: 0 } }
      );

      act(() => {
        result.current.x$.set(30);
        result.current.y$.set(40);
      });

      expect(result.current.style$.get()).toBe("left: 30px; top: 40px;");
      expect(result.current.position$.get()).toEqual({ x: 30, y: 40 });

      rerender({ count: 1 });

      expect(result.current.style$.get()).toBe("left: 30px; top: 40px;");
      expect(result.current.position$.get()).toEqual({ x: 30, y: 40 });
    });
  });

  describe("mid-operation preservation", () => {
    it("drag state persists when re-render occurs mid-drag", () => {
      const div = createDiv();

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useDraggable(wrapEl(div));
        },
        { initialProps: { count: 0 } }
      );

      // Start drag
      firePointerDown(div, 0, 0);
      expect(result.current.isDragging$.get()).toBe(true);

      // Re-render mid-drag
      rerender({ count: 1 });

      // Drag should still be active
      expect(result.current.isDragging$.get()).toBe(true);

      // Move after re-render — should still update position
      firePointerMove(50, 50);
      expect(result.current.x$.get()).toBe(50);
      expect(result.current.y$.get()).toBe(50);

      // End drag
      firePointerUp();
      expect(result.current.isDragging$.get()).toBe(false);
    });
  });

  describe("callback freshness", () => {
    it("onStart/onMove/onEnd callbacks use latest closure after re-render", () => {
      const div = createDiv();

      let capturedLabel = "initial";

      const { rerender } = renderHook(
        (props: { label: string }) => {
          return useDraggable(wrapEl(div), {
            onStart: () => {
              capturedLabel = props.label + ":start";
            },
            onMove: () => {
              capturedLabel = props.label + ":move";
            },
            onEnd: () => {
              capturedLabel = props.label + ":end";
            },
          });
        },
        { initialProps: { label: "initial" } }
      );

      rerender({ label: "updated" });

      firePointerDown(div, 0, 0);
      expect(capturedLabel).toBe("updated:start");

      firePointerMove(30, 30);
      expect(capturedLabel).toBe("updated:move");

      firePointerUp();
      expect(capturedLabel).toBe("updated:end");
    });
  });
});
