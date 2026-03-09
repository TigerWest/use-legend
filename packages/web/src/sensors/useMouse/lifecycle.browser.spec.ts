/**
 * useMouse — Element Lifecycle Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element lifecycle with real DOM events and no mocking.
 */
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useMouse } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  Object.assign(el.style, { width: "200px", height: "200px" });
  document.body.appendChild(el);
});

afterEach(() => {
  if (el.parentNode) document.body.removeChild(el);
});

function fireMouseOn(target: EventTarget, x: number, y: number) {
  target.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y }));
}

// ---------------------------------------------------------------------------
// useMouse — element lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("useMouse() — element lifecycle (real browser)", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ null → element: mousemove events are captured", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      // Mount element
      act(() => result.current.el$(el));

      // Fire real mousemove on element
      act(() => fireMouseOn(el, 42, 84));

      expect(result.current.mouse.x$.get()).toBe(42);
      expect(result.current.mouse.y$.get()).toBe(84);
      expect(result.current.mouse.sourceType$.get()).toBe("mouse");
    });

    it("Ref$ element → null: events on old element are ignored", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      act(() => result.current.el$(el));
      act(() => fireMouseOn(el, 42, 84));
      expect(result.current.mouse.x$.get()).toBe(42);

      // Unmount element
      act(() => result.current.el$(null));

      // Events on old element should not update state
      act(() => fireMouseOn(el, 999, 999));
      expect(result.current.mouse.x$.get()).toBe(42);
    });

    it("Ref$ element → null → element: events work after re-mount", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      // Mount → verify
      act(() => result.current.el$(el));
      act(() => fireMouseOn(el, 10, 20));
      expect(result.current.mouse.x$.get()).toBe(10);

      // Unmount
      act(() => result.current.el$(null));

      // Re-mount → verify events still work
      act(() => result.current.el$(el));
      act(() => fireMouseOn(el, 77, 33));
      expect(result.current.mouse.x$.get()).toBe(77);
      expect(result.current.mouse.y$.get()).toBe(33);
    });

    it("addEventListener/removeEventListener counts are symmetric after element → null", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, touch: true });
        return { el$, mouse };
      });

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      const addCount = addSpy.mock.calls.length;
      const removeCount = removeSpy.mock.calls.length;

      expect(addCount).toBeGreaterThan(0);
      expect(addCount).toBe(removeCount);
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable target null → element: mousemove events are captured", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => useMouse({ target: target$ as any, type: "client" }));

      // Set element
      act(() => target$.set(ObservableHint.opaque(el)));

      // Fire real mousemove
      act(() => fireMouseOn(el, 55, 66));

      expect(result.current.x$.get()).toBe(55);
      expect(result.current.y$.get()).toBe(66);
    });

    it("Observable target element → null: events on old element are ignored", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useMouse({ target: target$ as any, type: "client" }));

      act(() => fireMouseOn(el, 42, 84));
      expect(result.current.x$.get()).toBe(42);

      // Remove element
      act(() => target$.set(null));

      // Events should not update state
      act(() => fireMouseOn(el, 999, 999));
      expect(result.current.x$.get()).toBe(42);
    });

    it("Observable target element → null → element: events work after re-set", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useMouse({ target: target$ as any, type: "client" }));

      act(() => fireMouseOn(el, 10, 20));
      expect(result.current.x$.get()).toBe(10);

      // Remove and re-add
      act(() => target$.set(null));
      act(() => target$.set(ObservableHint.opaque(el)));

      act(() => fireMouseOn(el, 77, 33));
      expect(result.current.x$.get()).toBe(77);
      expect(result.current.y$.get()).toBe(33);
    });
  });

  // -------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // -------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ full lifecycle: no leaked listeners after multiple cycles", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, touch: true });
        return { el$, mouse };
      });

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      // 3 full cycles
      for (let i = 0; i < 3; i++) {
        act(() => result.current.el$(el));
        act(() => result.current.el$(null));
      }

      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    });

    it("coordinates retain last value on element removal, update on re-mount", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      act(() => result.current.el$(el));
      act(() => fireMouseOn(el, 42, 84));

      // Remove — last value retained
      act(() => result.current.el$(null));
      expect(result.current.mouse.x$.get()).toBe(42);
      expect(result.current.mouse.y$.get()).toBe(84);

      // Re-mount — new events work
      act(() => result.current.el$(el));
      act(() => fireMouseOn(el, 100, 200));
      expect(result.current.mouse.x$.get()).toBe(100);
      expect(result.current.mouse.y$.get()).toBe(200);
    });

    it("listener removed mid-tracking: old element events stop updating", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mouse = useMouse({ target: el$, type: "client" });
        return { el$, mouse };
      });

      act(() => result.current.el$(el));
      act(() => fireMouseOn(el, 50, 60));
      expect(result.current.mouse.sourceType$.get()).toBe("mouse");

      // Remove mid-tracking
      act(() => result.current.el$(null));

      // Old element events should not update
      act(() => fireMouseOn(el, 999, 999));
      expect(result.current.mouse.x$.get()).not.toBe(999);
    });
  });
});
