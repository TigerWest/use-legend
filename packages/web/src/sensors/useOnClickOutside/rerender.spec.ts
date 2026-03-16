// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useOnClickOutside } from ".";

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

function fireOutsideClick(el: Element) {
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
  el.dispatchEvent(new PointerEvent("click", { bubbles: true, composed: true }));
}

// ---------------------------------------------------------------------------
// rerender stability tests
// ---------------------------------------------------------------------------

describe("useOnClickOutside() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("does not re-register listeners on re-render", () => {
      const targetEl = document.createElement("div");
      document.body.appendChild(targetEl);
      const target$ = wrapEl(targetEl);
      const handler = vi.fn();
      const addSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useOnClickOutside(target$, handler);
        },
        { initialProps: { count: 0 } }
      );

      const countAfterMount = addSpy.mock.calls.length;

      rerender({ count: 1 });
      rerender({ count: 2 });
      rerender({ count: 3 });

      expect(addSpy.mock.calls.length).toBe(countAfterMount);
    });
  });

  // -------------------------------------------------------------------------
  // callback freshness
  // -------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("handler uses latest closure after re-render", () => {
      const targetEl = document.createElement("div");
      const outsideEl = document.createElement("button");
      document.body.appendChild(targetEl);
      document.body.appendChild(outsideEl);
      const target$ = wrapEl(targetEl);

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const { rerender } = renderHook(
        (props: { handler: (e: PointerEvent) => void }) =>
          useOnClickOutside(target$, props.handler),
        { initialProps: { handler: handler1 } }
      );

      // Re-render with a new handler
      rerender({ handler: handler2 });

      act(() => {
        fireOutsideClick(outsideEl);
      });

      // Only the latest handler should be called
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // stable return references
  // -------------------------------------------------------------------------

  describe("stable return references", () => {
    it("returned stop function reference is stable across re-renders", () => {
      const targetEl = document.createElement("div");
      document.body.appendChild(targetEl);
      const target$ = wrapEl(targetEl);
      const handler = vi.fn();

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useOnClickOutside(target$, handler);
        },
        { initialProps: { count: 0 } }
      );

      const stopBefore = result.current;

      rerender({ count: 1 });

      const stopAfter = result.current;

      expect(stopAfter).toBe(stopBefore);
    });
  });
});
