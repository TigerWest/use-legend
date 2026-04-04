// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useScroll } from ".";
import type { MaybeEventTarget } from "../../types";

const wrapEl = (el: Element): MaybeEventTarget<Element | Document | Window> =>
  observable<OpaqueObject<Element> | null>(
    ObservableHint.opaque(el)
  ) as unknown as MaybeEventTarget<Element | Document | Window>;

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
// useScroll — rerender stability
// ---------------------------------------------------------------------------

describe("useScroll() — rerender stability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("does not re-register scroll listener when unrelated state causes re-render", () => {
      const el = makeEl();
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useScroll(wrapEl(el));
        },
        { initialProps: { count: 0 } }
      );

      const addScrollAfterMount = addSpy.mock.calls.filter(([type]) => type === "scroll").length;
      const removeScrollAfterMount = removeSpy.mock.calls.filter(
        ([type]) => type === "scroll"
      ).length;

      rerender({ count: 1 });
      rerender({ count: 2 });

      expect(addSpy.mock.calls.filter(([type]) => type === "scroll").length).toBe(
        addScrollAfterMount
      );
      expect(removeSpy.mock.calls.filter(([type]) => type === "scroll").length).toBe(
        removeScrollAfterMount
      );
    });

    it("idle timer is not reset by unrelated re-render", () => {
      const onStop = vi.fn();
      const el = makeEl();

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useScroll(wrapEl(el), { onStop, idle: 200 });
        },
        { initialProps: { count: 0 } }
      );

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
      });

      // Re-render mid-idle — should not reset the timer
      rerender({ count: 1 });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // onStop should fire because total 200ms elapsed since scroll (not reset by re-render)
      expect(onStop).toHaveBeenCalledOnce();
    });

    it("throttled handler identity is stable across re-renders (useMemo)", () => {
      const el = makeEl();

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          // Expose handler identity via add spy count
          return useScroll(wrapEl(el), { throttle: 100 });
        },
        { initialProps: { count: 0 } }
      );

      const addSpy = vi.spyOn(el, "addEventListener");

      rerender({ count: 1 });
      rerender({ count: 2 });

      // addEventListener should not be called again with the same event type —
      // it means the handler reference remained the same and no re-registration occurred
      const scrollAdds = addSpy.mock.calls.filter(([type]) => type === "scroll").length;
      expect(scrollAdds).toBe(0);

      // Verify the hook still works correctly after re-renders
      act(() => {
        (el as any).scrollTop = 100;
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
      });
      expect(result.current.y$.get()).toBe(100);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("x$, y$, arrivedState$, directions$ remain accurate after re-render", () => {
      const el = makeEl({ scrollTop: 0 });

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useScroll(wrapEl(el));
        },
        { initialProps: { count: 0 } }
      );

      act(() => {
        (el as any).scrollTop = 300;
        el.dispatchEvent(new Event("scroll"));
      });

      const yBefore = result.current.y$.get();
      const bottomBefore = result.current.arrivedState$.bottom.get();
      const dirBottomBefore = result.current.directions$.bottom.get();

      rerender({ count: 1 });

      expect(result.current.y$.get()).toBe(yBefore);
      expect(result.current.arrivedState$.bottom.get()).toBe(bottomBefore);
      expect(result.current.directions$.bottom.get()).toBe(dirBottomBefore);
    });
  });

  // -------------------------------------------------------------------------
  // state preservation
  // -------------------------------------------------------------------------

  describe("state preservation", () => {
    it("isScrolling$ state is preserved during re-render", () => {
      const el = makeEl();

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useScroll(wrapEl(el), { idle: 300 });
        },
        { initialProps: { count: 0 } }
      );

      act(() => {
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.isScrolling$.get()).toBe(true);

      // Re-render while still scrolling
      rerender({ count: 1 });

      // isScrolling$ should still be true — not reset by re-render
      expect(result.current.isScrolling$.get()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // callback freshness
  // -------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("onStop callback uses latest closure after re-render", () => {
      const el = makeEl();
      const onStopV1 = vi.fn();
      const onStopV2 = vi.fn();

      let currentOnStop = onStopV1;

      const { rerender } = renderHook(() =>
        useScroll(wrapEl(el), {
          onStop: currentOnStop,
          idle: 100,
        })
      );

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
      });

      expect(onStopV1).toHaveBeenCalledOnce();

      // Update to v2 callback and re-render
      currentOnStop = onStopV2;
      rerender();

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
      });

      // After re-render, latest callback should be used
      expect(onStopV2).toHaveBeenCalledOnce();
      // Old callback should not be called again
      expect(onStopV1).toHaveBeenCalledOnce();
    });
  });
});
