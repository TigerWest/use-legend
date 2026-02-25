// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useScroll } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function makeEl(
  overrides: Partial<{
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  }> = {},
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

function setWindowDimensions(opts: {
  scrollX?: number;
  scrollY?: number;
  innerWidth?: number;
  innerHeight?: number;
  docScrollWidth?: number;
  docScrollHeight?: number;
}) {
  if (opts.scrollX !== undefined)
    Object.defineProperty(window, "scrollX", {
      writable: true,
      configurable: true,
      value: opts.scrollX,
    });
  if (opts.scrollY !== undefined)
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: opts.scrollY,
    });
  if (opts.innerWidth !== undefined)
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: opts.innerWidth,
    });
  if (opts.innerHeight !== undefined)
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: opts.innerHeight,
    });
  if (opts.docScrollWidth !== undefined)
    Object.defineProperty(document.documentElement, "scrollWidth", {
      writable: true,
      configurable: true,
      value: opts.docScrollWidth,
    });
  if (opts.docScrollHeight !== undefined)
    Object.defineProperty(document.documentElement, "scrollHeight", {
      writable: true,
      configurable: true,
      value: opts.docScrollHeight,
    });
}

describe("useScroll()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setWindowDimensions({
      scrollX: 0,
      scrollY: 0,
      innerWidth: 1024,
      innerHeight: 768,
      docScrollWidth: 1024,
      docScrollHeight: 2000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial values
  // -------------------------------------------------------------------------

  describe("initial values", () => {
    it("sets element.scrollLeft/scrollTop as initial x/y values on mount", () => {
      const el = makeEl({ scrollLeft: 50, scrollTop: 100 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));
      expect(result.current.x.get()).toBe(50);
      expect(result.current.y.get()).toBe(100);
    });

    it("sets window.scrollX/scrollY as initial x/y values on mount (Window target)", () => {
      setWindowDimensions({ scrollX: 20, scrollY: 40 });
      const { result } = renderHook(() => useScroll(window));
      expect(result.current.x.get()).toBe(20);
      expect(result.current.y.get()).toBe(40);
    });

    it("sets documentElement.scrollLeft/scrollTop as initial x/y values on mount (Document target)", () => {
      Object.defineProperty(document.documentElement, "scrollLeft", {
        writable: true,
        configurable: true,
        value: 10,
      });
      Object.defineProperty(document.documentElement, "scrollTop", {
        writable: true,
        configurable: true,
        value: 30,
      });
      const { result } = renderHook(() => useScroll(document));
      expect(result.current.x.get()).toBe(10);
      expect(result.current.y.get()).toBe(30);
    });

    it("initial arrivedState is top=true, left=true, right=false, bottom=false", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(wrapEl(el)));
      expect(result.current.arrivedState.top.get()).toBe(true);
      expect(result.current.arrivedState.left.get()).toBe(true);
      expect(result.current.arrivedState.right.get()).toBe(false);
      expect(result.current.arrivedState.bottom.get()).toBe(false);
    });

    it("initial isScrolling is false", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(wrapEl(el)));
      // advance timers to let idle expire
      act(() => { vi.runAllTimers(); });
      expect(result.current.isScrolling.get()).toBe(false);
    });

    it("initial directions are all false", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(wrapEl(el)));
      const d = result.current.directions;
      expect(d.left.get()).toBe(false);
      expect(d.right.get()).toBe(false);
      expect(d.top.get()).toBe(false);
      expect(d.bottom.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // x / y updates
  // -------------------------------------------------------------------------

  describe("x / y updates", () => {
    it("y increases when scrolling down", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 200;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(200);
    });

    it("y decreases when scrolling up", () => {
      const el = makeEl({ scrollTop: 300 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(100);
    });

    it("x increases when scrolling right", () => {
      const el = makeEl({ scrollLeft: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollLeft = 150;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.x.get()).toBe(150);
    });

    it("x decreases when scrolling left", () => {
      const el = makeEl({ scrollLeft: 200 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollLeft = 50;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.x.get()).toBe(50);
    });

    it("x does not change when only vertical scroll occurs", () => {
      const el = makeEl({ scrollLeft: 0, scrollTop: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.x.get()).toBe(0);
    });

    it("y does not change when only horizontal scroll occurs", () => {
      const el = makeEl({ scrollLeft: 0, scrollTop: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollLeft = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // arrivedState
  // -------------------------------------------------------------------------

  describe("arrivedState", () => {
    it("top=true when scrollTop is 0", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));
      expect(result.current.arrivedState.top.get()).toBe(true);
    });

    it("top=false when scrollTop is greater than 0", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 10;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.top.get()).toBe(false);
    });

    it("bottom=true when scrollTop reaches maxScrollY", () => {
      // scrollHeight=1000, clientHeight=400 → maxY=600
      const el = makeEl({ scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 600;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.bottom.get()).toBe(true);
    });

    it("left=true when scrollLeft is 0", () => {
      const el = makeEl({ scrollLeft: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));
      expect(result.current.arrivedState.left.get()).toBe(true);
    });

    it("right=true when scrollLeft reaches maxScrollX", () => {
      // scrollWidth=500, clientWidth=300 → maxX=200
      const el = makeEl({ scrollLeft: 0, scrollWidth: 500, clientWidth: 300 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollLeft = 200;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.right.get()).toBe(true);
    });

    it("top=true when scrollTop <= offset.top with offset.top set", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() =>
        useScroll(wrapEl(el), { offset: { top: 50 } }),
      );

      act(() => {
        (el as any).scrollTop = 30;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.top.get()).toBe(true);
    });

    it("bottom=true when scrollTop >= maxScrollY - offset.bottom with offset.bottom set", () => {
      // scrollHeight=1000, clientHeight=400 → maxY=600
      const el = makeEl({ scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() =>
        useScroll(wrapEl(el), { offset: { bottom: 50 } }),
      );

      act(() => {
        // 600 - 50 = 550 → bottom=true when scrollTop >= 550
        (el as any).scrollTop = 550;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.bottom.get()).toBe(true);
    });

    it("top=true and bottom=true for non-scrollable element (scrollHeight === clientHeight)", () => {
      // maxY = 400 - 400 = 0
      const el = makeEl({ scrollTop: 0, scrollHeight: 400, clientHeight: 400 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.arrivedState.top.get()).toBe(true);
      expect(result.current.arrivedState.bottom.get()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // directions
  // -------------------------------------------------------------------------

  describe("directions", () => {
    it("bottom=true and top=false when scrolling down", () => {
      const el = makeEl({ scrollTop: 100 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 200;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.directions.bottom.get()).toBe(true);
      expect(result.current.directions.top.get()).toBe(false);
    });

    it("top=true and bottom=false when scrolling up", () => {
      const el = makeEl({ scrollTop: 200 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.directions.top.get()).toBe(true);
      expect(result.current.directions.bottom.get()).toBe(false);
    });

    it("right=true and left=false when scrolling right", () => {
      const el = makeEl({ scrollLeft: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollLeft = 100;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.directions.right.get()).toBe(true);
      expect(result.current.directions.left.get()).toBe(false);
    });

    it("left=true and right=false when scrolling left", () => {
      const el = makeEl({ scrollLeft: 200 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollLeft = 50;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.directions.left.get()).toBe(true);
      expect(result.current.directions.right.get()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // isScrolling
  // -------------------------------------------------------------------------

  describe("isScrolling", () => {
    it("becomes true when scroll event fires", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.isScrolling.get()).toBe(true);
    });

    it("becomes false after idle time (default 200ms)", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(200);
      });

      expect(result.current.isScrolling.get()).toBe(false);
    });

    it("idle option adjusts the wait time", () => {
      const el = makeEl();
      const { result } = renderHook(() => useScroll(wrapEl(el), { idle: 500 }));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(200);
      });
      expect(result.current.isScrolling.get()).toBe(true);

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current.isScrolling.get()).toBe(false);
    });

    it("onStop callback is called when idle expires", () => {
      const onStop = vi.fn();
      const el = makeEl();
      renderHook(() => useScroll(wrapEl(el), { onStop, idle: 100 }));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
      });

      expect(onStop).toHaveBeenCalledOnce();
    });

    it("timer resets when additional scroll occurs before idle expires", () => {
      const onStop = vi.fn();
      const el = makeEl();
      renderHook(() => useScroll(wrapEl(el), { onStop, idle: 200 }));

      act(() => {
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
        el.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(100);
      });
      expect(onStop).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(onStop).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // measure()
  // -------------------------------------------------------------------------

  describe("measure()", () => {
    it("recalculates current scroll state on manual call", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 300;
        result.current.measure();
      });

      expect(result.current.y.get()).toBe(300);
    });

    it("all of x/y/arrivedState/directions are updated when measure() is called", () => {
      // scrollHeight=1000, clientHeight=400 → maxY=600
      const el = makeEl({ scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 600;
        result.current.measure();
      });

      expect(result.current.y.get()).toBe(600);
      expect(result.current.arrivedState.bottom.get()).toBe(true);
      expect(result.current.directions.bottom.get()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // throttle option
  // -------------------------------------------------------------------------

  describe("throttle option", () => {
    it("measure is called on every scroll event when throttle is not set", () => {
      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 100;
        el.dispatchEvent(new Event("scroll"));
        (el as any).scrollTop = 200;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(200);
    });

    it("consecutive calls within specified ms are ignored when throttle is set", () => {
      vi.useRealTimers(); // real timers needed for Date.now()

      const el = makeEl({ scrollTop: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el), { throttle: 100 }));

      act(() => {
        (el as any).scrollTop = 50;
        el.dispatchEvent(new Event("scroll"));
      });
      const firstY = result.current.y.get();
      expect(firstY).toBe(50);

      act(() => {
        // Second scroll within throttle window → skipped
        (el as any).scrollTop = 80;
        el.dispatchEvent(new Event("scroll"));
      });
      // y should remain 50 (throttled)
      expect(result.current.y.get()).toBe(50);
    });
  });

  // -------------------------------------------------------------------------
  // behavior by target type
  // -------------------------------------------------------------------------

  describe("behavior by target type", () => {
    it("Window target — uses scrollX/scrollY", () => {
      setWindowDimensions({ scrollX: 0, scrollY: 0 });
      const { result } = renderHook(() => useScroll(window));

      act(() => {
        setWindowDimensions({ scrollY: 500 });
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(500);
    });

    it("Document target — uses documentElement.scrollLeft/scrollTop", () => {
      Object.defineProperty(document.documentElement, "scrollLeft", {
        writable: true,
        configurable: true,
        value: 0,
      });
      Object.defineProperty(document.documentElement, "scrollTop", {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useScroll(document));

      act(() => {
        Object.defineProperty(document.documentElement, "scrollTop", {
          writable: true,
          configurable: true,
          value: 300,
        });
        document.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(300);
    });

    it("HTMLElement target — uses scrollLeft/scrollTop", () => {
      const el = makeEl({ scrollLeft: 0, scrollTop: 0 });
      const { result } = renderHook(() => useScroll(wrapEl(el)));

      act(() => {
        (el as any).scrollTop = 150;
        el.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.y.get()).toBe(150);
    });
  });

  // -------------------------------------------------------------------------
  // edge case: null target
  // -------------------------------------------------------------------------

  describe("edge case: null target", () => {
    it("returns x=0, y=0 without error when null target is passed", () => {
      const { result } = renderHook(() => useScroll(null));
      expect(result.current.x.get()).toBe(0);
      expect(result.current.y.get()).toBe(0);
    });

    it("arrivedState/directions maintain initial defaults when null target is passed", () => {
      const { result } = renderHook(() => useScroll(null));
      expect(result.current.arrivedState.top.get()).toBe(true);
      expect(result.current.arrivedState.left.get()).toBe(true);
      expect(result.current.arrivedState.right.get()).toBe(false);
      expect(result.current.arrivedState.bottom.get()).toBe(false);
    });

    it("does not register scroll event listener when null target is passed", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      renderHook(() => useScroll(null));
      const scrollCalls = addSpy.mock.calls.filter(([type]) => type === "scroll");
      expect(scrollCalls).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // unmount / cleanup
  // -------------------------------------------------------------------------

  describe("unmount / cleanup", () => {
    it("removes scroll event listener on unmount", async () => {
      const el = makeEl();
      const addSpy = vi.spyOn(el, "addEventListener");
      const removeSpy = vi.spyOn(el, "removeEventListener");

      const { unmount } = renderHook(() => useScroll(wrapEl(el)));
      unmount();
      await flush();

      expect(addSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);
      expect(removeSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);
    });

    it("cleans up pending idle timer on unmount", async () => {
      const onStop = vi.fn();
      const el = makeEl();
      const { unmount } = renderHook(() =>
        useScroll(wrapEl(el), { onStop, idle: 200 }),
      );

      act(() => {
        el.dispatchEvent(new Event("scroll"));
      });

      unmount();
      await flush();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(onStop).not.toHaveBeenCalled();
    });
  });
});
