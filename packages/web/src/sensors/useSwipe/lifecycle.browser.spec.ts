/**
 * useSwipe — Element Lifecycle Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element lifecycle with real TouchEvents and no mocking.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useSwipe } from ".";

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

function createTouchEvent(
  type: string,
  options: { clientX?: number; clientY?: number } = {}
): TouchEvent {
  const touch = new Touch({
    identifier: 0,
    target: document.body,
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    pageX: 0,
    pageY: 0,
    screenX: 0,
    screenY: 0,
    radiusX: 0,
    radiusY: 0,
    rotationAngle: 0,
    force: 0,
  });

  return new TouchEvent(type, {
    touches: type === "touchend" ? [] : [touch],
    changedTouches: [touch],
    targetTouches: type === "touchend" ? [] : [touch],
    bubbles: true,
    cancelable: true,
  });
}

function fireSwipe(target: EventTarget, startX: number, endX: number) {
  target.dispatchEvent(createTouchEvent("touchstart", { clientX: startX, clientY: 100 }));
  target.dispatchEvent(createTouchEvent("touchmove", { clientX: endX, clientY: 100 }));
  target.dispatchEvent(createTouchEvent("touchend", { clientX: endX, clientY: 100 }));
}

// ---------------------------------------------------------------------------
// useSwipe — element lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("useSwipe() — element lifecycle (real browser)", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ null → element: touchstart/touchmove/touchend detected, direction updated", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const swipe = useSwipe(el$);
        return { el$, swipe };
      });

      act(() => result.current.el$(el));
      await act(flush);

      // Swipe left: startX=200, endX=100 → dx=200-100=100 → "left"
      act(() => {
        fireSwipe(el, 200, 100);
      });

      expect(result.current.swipe.direction$.peek()).toBe("left");
    });

    it("Ref$ element → null: old element events ignored", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const swipe = useSwipe(el$);
        return { el$, swipe };
      });

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        fireSwipe(el, 200, 100);
      });
      expect(result.current.swipe.direction$.peek()).toBe("left");

      // Unmount
      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));
      // Wait until touchstart listener is specifically removed
      await waitFor(() =>
        expect(removeSpy).toHaveBeenCalledWith(
          "touchstart",
          expect.any(Function),
          expect.anything()
        )
      );

      // Events on old element should not update state
      act(() => {
        el.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
        el.dispatchEvent(createTouchEvent("touchmove", { clientX: 10, clientY: 100 }));
      });

      expect(result.current.swipe.isSwiping$.peek()).toBe(false);
    });

    it("Ref$ full cycle: listener counts symmetric", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const swipe = useSwipe(el$);
        return { el$, swipe };
      });

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => result.current.el$(el));
      await waitFor(() => expect(addSpy.mock.calls.length).toBeGreaterThan(0));
      act(() => result.current.el$(null));
      await waitFor(() => expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length));
    });

    it("Ref$ no leaked listeners after multiple cycles", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const swipe = useSwipe(el$);
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

    it("Ref$ element → null → element: events work after re-mount", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const swipe = useSwipe(el$);
        return { el$, swipe };
      });

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        fireSwipe(el, 200, 100);
      });
      expect(result.current.swipe.direction$.peek()).toBe("left");

      act(() => result.current.el$(null));
      await act(flush);

      act(() => result.current.el$(el));
      await act(flush);

      // Swipe right: startX=100, endX=250 → dx=100-250=-150 → "right"
      act(() => {
        fireSwipe(el, 100, 250);
      });
      expect(result.current.swipe.direction$.peek()).toBe("right");
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable null → element: swipe direction detected", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => useSwipe(target$ as any));

      const addSpy = vi.spyOn(el, "addEventListener");
      await act(async () => {
        target$.set(ObservableHint.opaque(el));
        await flush();
      });
      await waitFor(() => expect(addSpy.mock.calls.length).toBeGreaterThan(0));

      act(() => {
        fireSwipe(el, 200, 100);
      });

      expect(result.current.direction$.peek()).toBe("left");
    });

    it("Observable element → null: no swipe after removal", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useSwipe(target$ as any));
      await act(flush);

      act(() => {
        fireSwipe(el, 200, 100);
      });
      expect(result.current.direction$.peek()).toBe("left");

      const removeSpy = vi.spyOn(el, "removeEventListener");
      await act(async () => {
        target$.set(null);
        await flush();
      });
      // Wait until touchstart listener is specifically removed
      await waitFor(() =>
        expect(removeSpy).toHaveBeenCalledWith(
          "touchstart",
          expect.any(Function),
          expect.anything()
        )
      );

      // Events on old element should not register
      act(() => {
        el.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
        el.dispatchEvent(createTouchEvent("touchmove", { clientX: 10, clientY: 100 }));
      });

      expect(result.current.isSwiping$.peek()).toBe(false);
    });

    it("Observable full cycle: null → el → null → el works without leaks", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => useSwipe(target$ as any));

      // First mount
      const el1 = document.createElement("div");
      document.body.appendChild(el1);

      const addSpy1 = vi.spyOn(el1, "addEventListener");
      await act(async () => {
        target$.set(ObservableHint.opaque(el1));
        await flush();
      });
      await waitFor(() => expect(addSpy1.mock.calls.length).toBeGreaterThan(0));

      act(() => {
        fireSwipe(el1, 200, 100);
      });
      expect(result.current.direction$.peek()).toBe("left");

      // Unmount
      const removeSpy1 = vi.spyOn(el1, "removeEventListener");
      await act(async () => {
        target$.set(null);
        await flush();
      });
      await waitFor(() => expect(removeSpy1.mock.calls.length).toBe(addSpy1.mock.calls.length));

      // Second mount with new element
      const el2 = document.createElement("div");
      document.body.appendChild(el2);

      const addSpy2 = vi.spyOn(el2, "addEventListener");
      await act(async () => {
        target$.set(ObservableHint.opaque(el2));
        await flush();
      });
      await waitFor(() => expect(addSpy2.mock.calls.length).toBeGreaterThan(0));

      // Swipe right on new element
      act(() => {
        fireSwipe(el2, 100, 250);
      });
      expect(result.current.direction$.peek()).toBe("right");

      // Old element should not trigger swipe
      act(() => {
        el1.dispatchEvent(createTouchEvent("touchstart", { clientX: 100, clientY: 100 }));
        el1.dispatchEvent(createTouchEvent("touchmove", { clientX: 10, clientY: 100 }));
      });
      // direction$ should remain "right" — old element not tracked
      expect(result.current.direction$.peek()).toBe("right");

      document.body.removeChild(el1);
      document.body.removeChild(el2);
    });
  });
});
