// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useScroll } from ".";

function makeEl(
  overrides: Partial<{
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  }> = {}
): HTMLDivElement {
  const el = document.createElement("div");
  const {
    scrollLeft = 0,
    scrollTop = 0,
    scrollWidth = 500,
    scrollHeight = 1000,
    clientWidth = 300,
    clientHeight = 400,
  } = overrides;
  Object.defineProperties(el, {
    scrollLeft: { writable: true, configurable: true, value: scrollLeft },
    scrollTop: { writable: true, configurable: true, value: scrollTop },
    scrollWidth: { writable: true, configurable: true, value: scrollWidth },
    scrollHeight: { writable: true, configurable: true, value: scrollHeight },
    clientWidth: { writable: true, configurable: true, value: clientWidth },
    clientHeight: { writable: true, configurable: true, value: clientHeight },
  });
  return el;
}

// ---------------------------------------------------------------------------
// useScroll — element lifecycle
// ---------------------------------------------------------------------------

describe("useScroll() — element lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Ref$ target
  // -------------------------------------------------------------------------

  describe("Ref$ target", () => {
    it("Ref$ null → element: scroll listener is registered", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const scroll = useScroll(el$);
        return { el$, scroll };
      });

      const el = makeEl();
      const addSpy = vi.spyOn(el, "addEventListener");

      act(() => result.current.el$(el));

      expect(addSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);
    });

    it("Ref$ element → null: scroll listener is removed", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const scroll = useScroll(el$);
        return { el$, scroll };
      });

      const el = makeEl();
      act(() => result.current.el$(el));

      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));

      expect(removeSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);
    });

    it("addEventListener/removeEventListener call counts are symmetric after element → null", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const scroll = useScroll(el$);
        return { el$, scroll };
      });

      const el = makeEl();
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      const addScrollCount = addSpy.mock.calls.filter(([type]) => type === "scroll").length;
      const removeScrollCount = removeSpy.mock.calls.filter(([type]) => type === "scroll").length;

      expect(addScrollCount).toBe(removeScrollCount);
    });
  });

  // -------------------------------------------------------------------------
  // Observable target
  // -------------------------------------------------------------------------

  describe("Observable target", () => {
    it("Observable target null → element: scroll listener is registered", () => {
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);

      renderHook(() => useScroll(target$ as any));

      const el = makeEl();
      const addSpy = vi.spyOn(el, "addEventListener");

      act(() => target$.set(ObservableHint.opaque(el)));

      expect(addSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);
    });

    it("Observable target element → null: scroll listener is removed", () => {
      const el = makeEl();
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      renderHook(() => useScroll(target$ as any));

      const removeSpy = vi.spyOn(el, "removeEventListener");

      act(() => target$.set(null));

      expect(removeSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);
    });

    it("Observable target element → null → element: listener re-registered", () => {
      const el = makeEl();
      const target$ = observable<OpaqueObject<HTMLDivElement> | null>(ObservableHint.opaque(el));

      const { result } = renderHook(() => useScroll(target$ as any));

      // Remove element
      act(() => target$.set(null));

      // Re-add element
      const addSpy = vi.spyOn(el, "addEventListener");
      act(() => target$.set(ObservableHint.opaque(el)));

      expect(addSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);

      // Verify scroll events work after re-registration
      act(() => {
        (el as any).scrollTop = 50;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y$.get()).toBe(50);
    });
  });

  // -------------------------------------------------------------------------
  // full cycle (null → element → null → element)
  // -------------------------------------------------------------------------

  describe("full cycle (null → element → null → element)", () => {
    it("Ref$ full lifecycle: no leaked listeners or timers after multiple cycles", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const scroll = useScroll(el$);
        return { el$, scroll };
      });

      const el = makeEl();
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      // Cycle 1
      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      // Cycle 2
      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      // Cycle 3 (mount only — to verify symmetric after final unmount)
      act(() => result.current.el$(el));
      act(() => result.current.el$(null));

      // After 3 full cycles, add and remove counts should be equal (no leaks)
      const addScrollCount = addSpy.mock.calls.filter(([type]) => type === "scroll").length;
      const removeScrollCount = removeSpy.mock.calls.filter(([type]) => type === "scroll").length;

      expect(addScrollCount).toBe(removeScrollCount);
    });

    it("scroll listener is properly removed when element is removed during active scroll", () => {
      const { result } = renderHook(() => {
        const el$ = useRef$<HTMLDivElement>();
        const scroll = useScroll(el$, { idle: 200 });
        return { el$, scroll };
      });

      const el = makeEl();
      act(() => result.current.el$(el));

      // Start scrolling
      act(() => {
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.scroll.isScrolling$.get()).toBe(true);

      // Remove element — listener is removed
      const removeSpy = vi.spyOn(el, "removeEventListener");
      act(() => result.current.el$(null));

      expect(removeSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);

      // Scroll events on the old element no longer affect state
      act(() => {
        (el as any).scrollTop = 999;
        el.dispatchEvent(new Event("scroll"));
      });

      // y$ should remain at whatever it was before element removal (not 999)
      expect(result.current.scroll.y$.get()).not.toBe(999);
    });
  });
});
