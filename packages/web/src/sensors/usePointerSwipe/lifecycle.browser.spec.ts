/**
 * usePointerSwipe — Element Lifecycle Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element lifecycle with real PointerEvents (no polyfill needed).
 */
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { usePointerSwipe } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

let el: HTMLDivElement;

beforeEach(() => {
  el = document.createElement("div");
  Object.assign(el.style, { width: "200px", height: "200px" });
  document.body.appendChild(el);
});

afterEach(() => {
  if (el.parentNode) document.body.removeChild(el);
  vi.restoreAllMocks();
});

function fireSwipe(target: EventTarget, startX: number, endX: number) {
  target.dispatchEvent(
    new PointerEvent("pointerdown", { clientX: startX, clientY: 100, buttons: 1, bubbles: true })
  );
  target.dispatchEvent(
    new PointerEvent("pointermove", { clientX: endX, clientY: 100, buttons: 1, bubbles: true })
  );
  target.dispatchEvent(
    new PointerEvent("pointerup", { clientX: endX, clientY: 100, buttons: 0, bubbles: true })
  );
}

// ---------------------------------------------------------------------------
// usePointerSwipe — element lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("usePointerSwipe() — element lifecycle (real browser)", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ null → element: swipe detected (pointerdown + pointermove)", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const swipe = usePointerSwipe(el$, { threshold: 30 });
        return { el$, swipe };
      });

      expect(result.current.swipe.direction$.get()).toBe("none");

      act(() => result.current.el$(el));
      await act(flush);

      // Swipe right: startX=0, endX=80 → dx = 0-80 = -80 → "right"
      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 0, clientY: 100, buttons: 1, bubbles: true })
        );
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 80, clientY: 100, buttons: 1, bubbles: true })
        );
      });

      expect(result.current.swipe.isSwiping$.get()).toBe(true);
      expect(result.current.swipe.direction$.get()).toBe("right");

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerup", { clientX: 80, clientY: 100, buttons: 0, bubbles: true })
        );
      });
    });

    it("Ref$ element → null: no swipe after removal", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const swipe = usePointerSwipe(el$, { threshold: 30 });
        return { el$, swipe };
      });

      act(() => result.current.el$(el));
      await act(flush);

      act(() => fireSwipe(el, 0, 80));
      expect(result.current.swipe.direction$.get()).toBe("right");

      // Unmount
      act(() => result.current.el$(null));
      await act(flush);

      // New swipe on old element should not register
      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 0, clientY: 100, buttons: 1, bubbles: true })
        );
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 200, clientY: 100, buttons: 1, bubbles: true })
        );
      });

      expect(result.current.swipe.isSwiping$.get()).toBe(false);
    });

    it("Ref$ full cycle: listener counts symmetric", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const swipe = usePointerSwipe(el$, { threshold: 30 });
        return { el$, swipe };
      });

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => result.current.el$(el));
      await act(flush);
      act(() => result.current.el$(null));
      await act(flush);

      expect(addSpy.mock.calls.length).toBeGreaterThan(0);
      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    });

    it("Ref$ no leaked listeners after multiple cycles", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const swipe = usePointerSwipe(el$, { threshold: 30 });
        return { el$, swipe };
      });

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      for (let i = 0; i < 3; i++) {
        act(() => result.current.el$(el));
        await act(flush);
        act(() => result.current.el$(null));
        await act(flush);
      }

      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable null → element: swipe detected", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => usePointerSwipe(target$ as any, { threshold: 30 }));

      expect(result.current.direction$.get()).toBe("none");

      await act(async () => {
        target$.set(ObservableHint.opaque(el));
        await flush();
      });

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 0, clientY: 100, buttons: 1, bubbles: true })
        );
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 80, clientY: 100, buttons: 1, bubbles: true })
        );
      });

      expect(result.current.direction$.get()).toBe("right");
      expect(result.current.isSwiping$.get()).toBe(true);

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerup", { clientX: 80, clientY: 100, buttons: 0, bubbles: true })
        );
      });
    });

    it("Observable element → null: stopped", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => usePointerSwipe(target$ as any, { threshold: 30 }));
      await act(flush);

      act(() => fireSwipe(el, 0, 80));
      expect(result.current.direction$.get()).toBe("right");

      await act(async () => {
        target$.set(null);
        await flush();
      });

      // Events on old element should not register
      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 0, clientY: 100, buttons: 1, bubbles: true })
        );
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 200, clientY: 100, buttons: 1, bubbles: true })
        );
      });

      expect(result.current.isSwiping$.get()).toBe(false);
    });

    it("Observable full cycle: null → el → null → el works without leaks", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => usePointerSwipe(target$ as any, { threshold: 30 }));

      // First mount
      await act(async () => {
        target$.set(ObservableHint.opaque(el));
        await flush();
      });

      act(() => fireSwipe(el, 0, 80));
      expect(result.current.direction$.get()).toBe("right");
      expect(result.current.isSwiping$.get()).toBe(false); // reset by pointerup

      // Unmount
      await act(async () => {
        target$.set(null);
        await flush();
      });

      // Second mount with new element
      const el2 = document.createElement("div");
      Object.assign(el2.style, { width: "200px", height: "200px" });
      document.body.appendChild(el2);

      await act(async () => {
        target$.set(ObservableHint.opaque(el2));
        await flush();
      });

      // Swipe left on new element: startX=100, endX=0 → dx = 100-0 = 100 → "left"
      act(() => {
        el2.dispatchEvent(
          new PointerEvent("pointerdown", { clientX: 100, clientY: 100, buttons: 1, bubbles: true })
        );
        el2.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 0, clientY: 100, buttons: 1, bubbles: true })
        );
      });

      expect(result.current.direction$.get()).toBe("left");
      expect(result.current.isSwiping$.get()).toBe(true);

      act(() => {
        el2.dispatchEvent(
          new PointerEvent("pointerup", { clientX: 0, clientY: 100, buttons: 0, bubbles: true })
        );
      });

      // Old element should not trigger
      act(() => fireSwipe(el, 0, 200));
      expect(result.current.isSwiping$.get()).toBe(false);

      document.body.removeChild(el2);
    });
  });
});
