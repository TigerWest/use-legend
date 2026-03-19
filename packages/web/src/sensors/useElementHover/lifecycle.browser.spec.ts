/**
 * useElementHover — Element Lifecycle Browser Spec
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element lifecycle with real DOM events and no mocking.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useElementHover } from ".";

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
// useElementHover — element lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("useElementHover() — element lifecycle (real browser)", () => {
  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ null → element: mouseenter detected", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const isHovered$ = useElementHover(el$);
        return { el$, isHovered$ };
      });

      expect(result.current.isHovered$.get()).toBe(false);

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });

      expect(result.current.isHovered$.get()).toBe(true);
    });

    it("Ref$ element → null: old element events ignored", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const isHovered$ = useElementHover(el$);
        return { el$, isHovered$ };
      });

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(true);

      // Reset to false via mouseleave so we can detect if mouseenter fires after null
      act(() => {
        el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(false);

      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));
      // Wait until the mouseenter listener is specifically removed
      await waitFor(() =>
        expect(removeSpy).toHaveBeenCalledWith(
          "mouseenter",
          expect.any(Function),
          expect.anything()
        )
      );

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      // State should remain false — listener was removed, event ignored
      expect(result.current.isHovered$.get()).toBe(false);
    });

    it("Ref$ full cycle null → el → null → el: no listener leaks", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const isHovered$ = useElementHover(el$);
        return { el$, isHovered$ };
      });

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      for (let i = 0; i < 3; i++) {
        act(() => result.current.el$(el));
        await act(flush);
        act(() => result.current.el$(null));
        await act(flush);
      }

      expect(addSpy.mock.calls.length).toBeGreaterThan(0);
      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
    });

    it("Ref$ element → null → element: events work after re-mount", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const isHovered$ = useElementHover(el$);
        return { el$, isHovered$ };
      });

      // First mount
      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(true);

      // Unmount
      act(() => result.current.el$(null));
      await act(flush);

      // Re-mount — events should work again
      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(false);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable null → element: mouseenter/mouseleave works", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => useElementHover(target$ as any));

      expect(result.current.get()).toBe(false);

      await act(async () => {
        target$.set(ObservableHint.opaque(el));
        await flush();
      });

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.get()).toBe(true);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(result.current.get()).toBe(false);
    });

    it("Observable element → null: events stopped", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useElementHover(target$ as any));
      await act(flush);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.get()).toBe(true);

      // Reset to false via mouseleave so we can detect if mouseenter fires after null
      act(() => {
        el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(result.current.get()).toBe(false);

      const removeSpy = vi.spyOn(el, "removeEventListener");
      await act(async () => {
        target$.set(null);
        await flush();
      });
      // Wait until the mouseenter listener is specifically removed
      await waitFor(() =>
        expect(removeSpy).toHaveBeenCalledWith(
          "mouseenter",
          expect.any(Function),
          expect.anything()
        )
      );

      // mouseenter on old element should have no effect
      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.get()).toBe(false);
    });

    it("Observable full cycle: null → el → null → el works without leaks", async () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      const { result } = renderHook(() => useElementHover(target$ as any));

      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      // Cycle 1: null → el
      await act(async () => {
        target$.set(ObservableHint.opaque(el));
        await flush();
      });

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.get()).toBe(true);

      // Cycle 2: el → null
      await act(async () => {
        target$.set(null);
        await flush();
      });

      expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);

      // Cycle 3: null → new element
      const el2 = document.createElement("div");
      document.body.appendChild(el2);

      await act(async () => {
        target$.set(ObservableHint.opaque(el2));
        await flush();
      });

      act(() => {
        el2.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.get()).toBe(true);

      act(() => {
        el2.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(result.current.get()).toBe(false);

      document.body.removeChild(el2);
    });
  });

  // -------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // -------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ full lifecycle: no leaked listeners after multiple cycles", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const isHovered$ = useElementHover(el$);
        return { el$, isHovered$ };
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

    it("hover state retained on element removal, updates on re-mount", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const isHovered$ = useElementHover(el$);
        return { el$, isHovered$ };
      });

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(true);

      // Remove — last value retained
      act(() => result.current.el$(null));
      await act(flush);
      expect(result.current.isHovered$.get()).toBe(true);

      // Re-mount — new events work
      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(false);
    });

    it("mouseleave stops hover after mouseenter cycle", async () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const isHovered$ = useElementHover(el$);
        return { el$, isHovered$ };
      });

      act(() => result.current.el$(el));
      await act(flush);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(true);

      act(() => {
        el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(false);

      // Remove mid-tracking
      act(() => result.current.el$(null));
      await act(flush);

      // Old element events should not update
      act(() => {
        el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(result.current.isHovered$.get()).toBe(false);
    });
  });
});
