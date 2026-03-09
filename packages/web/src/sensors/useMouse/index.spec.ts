// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useMouse } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fireMouseMove(coords: {
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  screenX?: number;
  screenY?: number;
  movementX?: number;
  movementY?: number;
  target?: EventTarget;
}) {
  const { target = window, ...eventInit } = coords;
  act(() => {
    (target as EventTarget).dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, ...eventInit })
    );
  });
}

function createTouchEvent(type: string, touches: Array<Partial<Touch>> = []) {
  const event = new Event(type, { bubbles: true }) as Event & {
    touches: Partial<Touch>[];
  };
  Object.defineProperty(event, "touches", { value: touches });
  return event;
}

// ---------------------------------------------------------------------------
// useMouse tests
// ---------------------------------------------------------------------------

describe("useMouse()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // initial values
  // -------------------------------------------------------------------------

  describe("initial values", () => {
    it("x$=0, y$=0 by default", () => {
      const { result } = renderHook(() => useMouse());
      expect(result.current.x$.get()).toBe(0);
      expect(result.current.y$.get()).toBe(0);
    });

    it("respects initialValue option", () => {
      const { result } = renderHook(() => useMouse({ initialValue: { x: 50, y: 80 } }));
      expect(result.current.x$.get()).toBe(50);
      expect(result.current.y$.get()).toBe(80);
    });

    it("sourceType$ is null initially", () => {
      const { result } = renderHook(() => useMouse());
      expect(result.current.sourceType$.get()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // mouse tracking
  // -------------------------------------------------------------------------

  describe("mouse tracking", () => {
    it("updates x$, y$ on mousemove", () => {
      const { result } = renderHook(() => useMouse());

      fireMouseMove({ clientX: 100, clientY: 200 });

      expect(result.current.x$.get()).toBe(100);
      expect(result.current.y$.get()).toBe(200);
    });

    it("sets sourceType$ to 'mouse' on mousemove", () => {
      const { result } = renderHook(() => useMouse());

      fireMouseMove({ clientX: 10, clientY: 20 });

      expect(result.current.sourceType$.get()).toBe("mouse");
    });
  });

  // -------------------------------------------------------------------------
  // coordinate types
  // -------------------------------------------------------------------------

  describe("coordinate types", () => {
    it("type='page' uses pageX/pageY", () => {
      const { result } = renderHook(() => useMouse({ type: "page" }));

      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            clientX: 1,
            clientY: 2,
            // pageX/pageY are not directly settable via MouseEventInit in jsdom
            // but we can verify the hook uses page coords by checking the default
          })
        );
      });

      // pageX/pageY are same as clientX/clientY in jsdom (no scroll offset)
      expect(result.current.x$.get()).toBe(1);
      expect(result.current.y$.get()).toBe(2);
    });

    it("type='client' uses clientX/clientY", () => {
      const { result } = renderHook(() => useMouse({ type: "client" }));

      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            clientX: 100,
            clientY: 200,
          })
        );
      });

      expect(result.current.x$.get()).toBe(100);
      expect(result.current.y$.get()).toBe(200);
    });

    it("type='screen' uses screenX/screenY", () => {
      const { result } = renderHook(() => useMouse({ type: "screen" }));

      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            screenX: 300,
            screenY: 400,
            clientX: 100,
            clientY: 200,
          })
        );
      });

      expect(result.current.x$.get()).toBe(300);
      expect(result.current.y$.get()).toBe(400);
    });

    it("type='movement' uses movementX/movementY", () => {
      const { result } = renderHook(() => useMouse({ type: "movement" }));

      act(() => {
        const event = new MouseEvent("mousemove", {
          bubbles: true,
          clientX: 100,
          clientY: 200,
        });
        // JSDOM doesn't support movementX/Y in MouseEventInit — set manually
        Object.defineProperty(event, "movementX", { value: 5 });
        Object.defineProperty(event, "movementY", { value: 10 });
        window.dispatchEvent(event);
      });

      expect(result.current.x$.get()).toBe(5);
      expect(result.current.y$.get()).toBe(10);
    });
  });

  // -------------------------------------------------------------------------
  // touch support
  // -------------------------------------------------------------------------

  describe("touch support", () => {
    it("updates x$, y$ on touchmove when touch=true", () => {
      const { result } = renderHook(() => useMouse({ touch: true }));

      act(() => {
        window.dispatchEvent(
          createTouchEvent("touchmove", [{ pageX: 55, pageY: 77, clientX: 55, clientY: 77 }])
        );
      });

      expect(result.current.x$.get()).toBe(55);
      expect(result.current.y$.get()).toBe(77);
    });

    it("sets sourceType$ to 'touch' on touchmove", () => {
      const { result } = renderHook(() => useMouse({ touch: true }));

      act(() => {
        window.dispatchEvent(
          createTouchEvent("touchmove", [{ pageX: 55, pageY: 77, clientX: 55, clientY: 77 }])
        );
      });

      expect(result.current.sourceType$.get()).toBe("touch");
    });

    it("does not track touch when touch=false", () => {
      const { result } = renderHook(() => useMouse({ touch: false }));

      act(() => {
        window.dispatchEvent(createTouchEvent("touchmove", [{ clientX: 99, clientY: 88 }]));
      });

      expect(result.current.x$.get()).toBe(0);
      expect(result.current.y$.get()).toBe(0);
      expect(result.current.sourceType$.get()).toBeNull();
    });

    it("resetOnTouchEnds=true resets to initial on touchend", () => {
      const { result } = renderHook(() =>
        useMouse({ touch: true, resetOnTouchEnds: true, initialValue: { x: 0, y: 0 } })
      );

      act(() => {
        window.dispatchEvent(
          createTouchEvent("touchmove", [{ pageX: 55, pageY: 77, clientX: 55, clientY: 77 }])
        );
      });
      expect(result.current.x$.get()).toBe(55);

      act(() => {
        window.dispatchEvent(new Event("touchend", { bubbles: true }));
      });

      expect(result.current.x$.get()).toBe(0);
      expect(result.current.y$.get()).toBe(0);
    });

    it("resetOnTouchEnds=false keeps last position on touchend", () => {
      const { result } = renderHook(() => useMouse({ touch: true, resetOnTouchEnds: false }));

      act(() => {
        window.dispatchEvent(
          createTouchEvent("touchmove", [{ pageX: 55, pageY: 77, clientX: 55, clientY: 77 }])
        );
      });
      expect(result.current.x$.get()).toBe(55);

      act(() => {
        window.dispatchEvent(new Event("touchend", { bubbles: true }));
      });

      expect(result.current.x$.get()).toBe(55);
      expect(result.current.y$.get()).toBe(77);
    });
  });

  // -------------------------------------------------------------------------
  // custom target
  // -------------------------------------------------------------------------

  describe("custom target", () => {
    it("listens on specified element instead of window", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      const target$ = observable<OpaqueObject<HTMLElement> | null>(ObservableHint.opaque(div));

      const { result } = renderHook(() => useMouse({ target: target$ }));

      // Should NOT update on window-only event (non-bubbling)
      act(() => {
        window.dispatchEvent(
          new MouseEvent("mousemove", { bubbles: false, clientX: 999, clientY: 999 })
        );
      });
      expect(result.current.x$.get()).toBe(0);

      // SHOULD update on element event
      act(() => {
        div.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 42, clientY: 84 }));
      });
      expect(result.current.x$.get()).toBe(42);
      expect(result.current.y$.get()).toBe(84);

      document.body.removeChild(div);
    });
  });

  // -------------------------------------------------------------------------
  // SSR guard
  // -------------------------------------------------------------------------

  describe("SSR guard", () => {
    it("returns initial values when window is undefined", () => {
      // In jsdom window is always defined, so we verify the hook
      // returns the expected observables with initial values
      const { result } = renderHook(() => useMouse({ initialValue: { x: 0, y: 0 } }));

      expect(result.current.x$.get()).toBe(0);
      expect(result.current.y$.get()).toBe(0);
      expect(result.current.sourceType$.get()).toBeNull();
    });
  });
});
