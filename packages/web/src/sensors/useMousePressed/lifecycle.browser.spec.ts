/**
 * useMousePressed — Element Lifecycle Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element lifecycle with real DOM events and no mocking.
 */
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useMousePressed } from ".";

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

function firePointerDown(target: EventTarget = el) {
  target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
}

function firePointerUp(target: EventTarget = window) {
  target.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
}

// ---------------------------------------------------------------------------
// useMousePressed — element lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("useMousePressed() — element lifecycle (real browser)", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ null → element: pointerdown events update pressed$", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      // Mount element
      act(() => result.current.el$(el));

      // Fire real pointerdown on element
      act(() => firePointerDown(el));

      expect(result.current.mp.pressed$.get()).toBe(true);
      expect(result.current.mp.sourceType$.get()).toBe("mouse");

      // Fire real pointerup on window
      act(() => firePointerUp(window));

      expect(result.current.mp.pressed$.get()).toBe(false);
    });

    it("Ref$ element → null: events on old element are ignored", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      act(() => result.current.el$(el));
      act(() => firePointerDown(el));
      expect(result.current.mp.pressed$.get()).toBe(true);

      act(() => firePointerUp(window));
      expect(result.current.mp.pressed$.get()).toBe(false);

      // Unmount element
      act(() => result.current.el$(null));

      // Events on old element should not update pressed$
      act(() => firePointerDown(el));
      expect(result.current.mp.pressed$.get()).toBe(false);
    });

    it("Ref$ element → null → element: events work after re-mount", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      // Mount → verify
      act(() => result.current.el$(el));
      act(() => firePointerDown(el));
      expect(result.current.mp.pressed$.get()).toBe(true);
      act(() => firePointerUp(window));

      // Unmount
      act(() => result.current.el$(null));

      // Re-mount → verify events still work
      act(() => result.current.el$(el));
      act(() => firePointerDown(el));
      expect(result.current.mp.pressed$.get()).toBe(true);
      expect(result.current.mp.sourceType$.get()).toBe("mouse");

      act(() => firePointerUp(window));
      expect(result.current.mp.pressed$.get()).toBe(false);
    });

    it("addEventListener/removeEventListener counts are symmetric after element → null", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$, touch: true });
        return { el$, mp };
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
    it("Observable target null → element: pointerdown events update pressed$", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => useMousePressed({ target: target$ as any }));

      // Set element
      act(() => target$.set(ObservableHint.opaque(el)));

      // Fire real pointerdown
      act(() => firePointerDown(el));

      expect(result.current.pressed$.get()).toBe(true);
      expect(result.current.sourceType$.get()).toBe("mouse");

      act(() => firePointerUp(window));
      expect(result.current.pressed$.get()).toBe(false);
    });

    it("Observable target element → null: events on old element are ignored", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useMousePressed({ target: target$ as any }));

      act(() => firePointerDown(el));
      expect(result.current.pressed$.get()).toBe(true);

      act(() => firePointerUp(window));
      expect(result.current.pressed$.get()).toBe(false);

      // Remove element
      act(() => target$.set(null));

      // Events should not update state
      act(() => firePointerDown(el));
      expect(result.current.pressed$.get()).toBe(false);
    });

    it("Observable target element → null → element: events work after re-set", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useMousePressed({ target: target$ as any }));

      act(() => firePointerDown(el));
      expect(result.current.pressed$.get()).toBe(true);
      act(() => firePointerUp(window));

      // Remove and re-add
      act(() => target$.set(null));
      act(() => target$.set(ObservableHint.opaque(el)));

      act(() => firePointerDown(el));
      expect(result.current.pressed$.get()).toBe(true);
      expect(result.current.sourceType$.get()).toBe("mouse");

      act(() => firePointerUp(window));
      expect(result.current.pressed$.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // -------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ full lifecycle: no leaked listeners after multiple cycles", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$, touch: true });
        return { el$, mp };
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

    it("pressed state retains last value on element removal, updates on re-mount", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const mp = useMousePressed({ target: el$ });
        return { el$, mp };
      });

      act(() => result.current.el$(el));
      act(() => firePointerDown(el));
      expect(result.current.mp.pressed$.get()).toBe(true);

      // Remove element while pressed — pressed$ stays true (pointerup is on window)
      act(() => result.current.el$(null));
      expect(result.current.mp.pressed$.get()).toBe(true);

      // Release via window — still works even after element removed
      act(() => firePointerUp(window));
      expect(result.current.mp.pressed$.get()).toBe(false);

      // Re-mount — new events work
      act(() => result.current.el$(el));
      act(() => firePointerDown(el));
      expect(result.current.mp.pressed$.get()).toBe(true);
      expect(result.current.mp.sourceType$.get()).toBe("mouse");
    });
  });
});
