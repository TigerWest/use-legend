/**
 * usePointer — Element Lifecycle Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element lifecycle with real PointerEvents (no polyfill needed).
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { usePointer } from ".";

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

// ---------------------------------------------------------------------------
// usePointer — element lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("usePointer() — element lifecycle (real browser)", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ null → element: pointermove updates x$/y$/isInside$", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const pointer = usePointer({ target: el$ });
        return { el$, pointer };
      });

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 100, clientY: 200, bubbles: true })
        );
      });

      expect(result.current.pointer.x$.get()).toBe(100);
      expect(result.current.pointer.y$.get()).toBe(200);
      expect(result.current.pointer.isInside$.get()).toBe(true);
    });

    it("Ref$ element → null: old element events ignored", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const pointer = usePointer({ target: el$ });
        return { el$, pointer };
      });

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 50, clientY: 60, bubbles: true })
        );
      });
      expect(result.current.pointer.x$.get()).toBe(50);

      // Unmount element
      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));
      // Wait until pointermove listener is specifically removed
      await waitFor(() =>
        expect(removeSpy).toHaveBeenCalledWith(
          "pointermove",
          expect.any(Function),
          expect.anything()
        )
      );

      // Events on old element should not update state
      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 999, clientY: 999, bubbles: true })
        );
      });
      expect(result.current.pointer.x$.get()).toBe(50);
    });

    it("Ref$ full cycle: addEventListener/removeEventListener symmetric", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const pointer = usePointer({ target: el$ });
        return { el$, pointer };
      });

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => result.current.el$(el));
      await waitFor(() => expect(addSpy.mock.calls.length).toBeGreaterThan(0));
      act(() => result.current.el$(null));
      await waitFor(() => expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length));
    });

    it("Ref$ full cycle: no leaked listeners after multiple cycles", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const pointer = usePointer({ target: el$ });
        return { el$, pointer };
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
        const pointer = usePointer({ target: el$ });
        return { el$, pointer };
      });

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 10, clientY: 20, bubbles: true })
        );
      });
      expect(result.current.pointer.x$.get()).toBe(10);

      act(() => result.current.el$(null));
      await act(flush);

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 77, clientY: 33, bubbles: true })
        );
      });
      expect(result.current.pointer.x$.get()).toBe(77);
      expect(result.current.pointer.y$.get()).toBe(33);
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable null → element: pointermove captured", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => usePointer({ target: target$ as any }));

      await act(async () => {
        target$.set(ObservableHint.opaque(el));
        await flush();
      });

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 55, clientY: 66, bubbles: true })
        );
      });

      expect(result.current.x$.get()).toBe(55);
      expect(result.current.y$.get()).toBe(66);
      expect(result.current.isInside$.get()).toBe(true);
    });

    it("Observable element → null: events stopped", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => usePointer({ target: target$ as any }));
      await act(flush);

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 42, clientY: 84, bubbles: true })
        );
      });
      expect(result.current.x$.get()).toBe(42);

      const removeSpy = vi.spyOn(el, "removeEventListener");
      await act(async () => {
        target$.set(null);
        await flush();
      });
      // Wait until pointermove listener is specifically removed
      await waitFor(() =>
        expect(removeSpy).toHaveBeenCalledWith(
          "pointermove",
          expect.any(Function),
          expect.anything()
        )
      );

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 999, clientY: 999, bubbles: true })
        );
      });
      expect(result.current.x$.get()).toBe(42);
    });

    it("Observable full cycle: null → el → null → el works without leaks", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => usePointer({ target: target$ as any }));

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      await act(async () => {
        target$.set(ObservableHint.opaque(el));
        await flush();
      });

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 10, clientY: 20, bubbles: true })
        );
      });
      expect(result.current.x$.get()).toBe(10);

      await act(async () => {
        target$.set(null);
        await flush();
      });

      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);

      // Re-mount with new element
      const el2 = document.createElement("div");
      document.body.appendChild(el2);

      await act(async () => {
        target$.set(ObservableHint.opaque(el2));
        await flush();
      });

      act(() => {
        el2.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 77, clientY: 33, bubbles: true })
        );
      });
      expect(result.current.x$.get()).toBe(77);

      document.body.removeChild(el2);
    });
  });

  // -------------------------------------------------------------------------
  // No target (default window)
  // -------------------------------------------------------------------------

  describe("No target (default window)", () => {
    it("no target: pointermove on window works", async () => {
      const { result } = renderHook(() => usePointer());
      await act(flush);

      act(() => {
        window.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 300, clientY: 400, bubbles: true })
        );
      });

      expect(result.current.x$.get()).toBe(300);
      expect(result.current.y$.get()).toBe(400);
    });

    it("pointerleave sets isInside$ to false", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => usePointer({ target: target$ as any }));
      await act(flush);

      act(() => {
        el.dispatchEvent(
          new PointerEvent("pointermove", { clientX: 50, clientY: 50, bubbles: true })
        );
      });
      expect(result.current.isInside$.get()).toBe(true);

      act(() => {
        el.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
      });
      expect(result.current.isInside$.get()).toBe(false);
    });
  });
});
