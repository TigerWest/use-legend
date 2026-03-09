/**
 * useMouse — Browser Mode Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Catches issues that JSDOM tests miss — e.g. lazy computed activation,
 * real event propagation, and window-level listener behavior.
 */
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useMouse } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fireMouseOn(target: EventTarget, x: number, y: number) {
  target.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y }));
}

function createTouchEvent(type: string, touches: Array<Partial<Touch>> = []) {
  const event = new Event(type, { bubbles: true }) as Event & {
    touches: Partial<Touch>[];
  };
  Object.defineProperty(event, "touches", { value: touches });
  return event;
}

let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  Object.assign(el.style, { width: "200px", height: "200px" });
  document.body.appendChild(el);
});

afterEach(() => {
  if (el.parentNode) document.body.removeChild(el);
});

// ---------------------------------------------------------------------------
// useMouse — real browser
// ---------------------------------------------------------------------------

describe("useMouse() — real browser", () => {
  // -------------------------------------------------------------------------
  // Default (window) target — no target option
  // This is the exact scenario that broke in the demo.
  // -------------------------------------------------------------------------

  describe("default window target (no target option)", () => {
    it("tracks mouse on window when no target is provided", () => {
      const { result } = renderHook(() => useMouse({ type: "client" }));

      act(() => fireMouseOn(window, 100, 200));

      expect(result.current.x$.get()).toBe(100);
      expect(result.current.y$.get()).toBe(200);
      expect(result.current.sourceType$.get()).toBe("mouse");
    });

    it("tracks mouse when called with no options at all", () => {
      const { result } = renderHook(() => useMouse());

      act(() => fireMouseOn(window, 50, 75));

      expect(result.current.x$.get()).not.toBe(0);
      expect(result.current.sourceType$.get()).toBe("mouse");
    });

    it("updates coordinates on subsequent mousemove events", () => {
      const { result } = renderHook(() => useMouse({ type: "client" }));

      act(() => fireMouseOn(window, 10, 20));
      expect(result.current.x$.get()).toBe(10);

      act(() => fireMouseOn(window, 300, 400));
      expect(result.current.x$.get()).toBe(300);
      expect(result.current.y$.get()).toBe(400);
    });

    it("coordinate types work correctly", () => {
      const { result } = renderHook(() => useMouse({ type: "screen" }));

      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            screenX: 500,
            screenY: 600,
            clientX: 100,
            clientY: 200,
          })
        );
      });

      expect(result.current.x$.get()).toBe(500);
      expect(result.current.y$.get()).toBe(600);
    });
  });

  // -------------------------------------------------------------------------
  // Custom Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("tracks mouse on Ref$ target element", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      act(() => result.current.el$(el));
      act(() => fireMouseOn(el, 42, 84));

      expect(result.current.mouse.x$.get()).toBe(42);
      expect(result.current.mouse.y$.get()).toBe(84);
    });

    it("does not respond to window events when Ref$ target is set", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      act(() => result.current.el$(el));

      // Non-bubbling window event should not reach element listener
      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", { bubbles: false, clientX: 999, clientY: 999 })
        );
      });

      expect(result.current.mouse.x$.get()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Custom Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("tracks mouse on Observable target element", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useMouse({ target: target$ as any, type: "client" }));

      act(() => fireMouseOn(el, 55, 66));

      expect(result.current.x$.get()).toBe(55);
      expect(result.current.y$.get()).toBe(66);
    });
  });

  // -------------------------------------------------------------------------
  // Touch support
  // -------------------------------------------------------------------------

  describe("touch support", () => {
    it("tracks touch events on window", () => {
      const { result } = renderHook(() => useMouse({ touch: true, type: "client" }));

      act(() => {
        window.dispatchEvent(createTouchEvent("touchmove", [{ clientX: 77, clientY: 88 }]));
      });

      expect(result.current.x$.get()).toBe(77);
      expect(result.current.y$.get()).toBe(88);
      expect(result.current.sourceType$.get()).toBe("touch");
    });

    it("does not track touch when touch=false", () => {
      const { result } = renderHook(() => useMouse({ touch: false, type: "client" }));

      act(() => {
        window.dispatchEvent(createTouchEvent("touchmove", [{ clientX: 77, clientY: 88 }]));
      });

      expect(result.current.x$.get()).toBe(0);
      expect(result.current.sourceType$.get()).toBeNull();
    });
  });
});
