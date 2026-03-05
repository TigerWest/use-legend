// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "@usels/core";
import { useElementBounding } from ".";

const wrapEl = (el: Element) =>
  observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

// ---------------------------------------------------------------------------
// ResizeObserver mock
// ---------------------------------------------------------------------------

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  callback: ResizeObserverCallback;
  observed: Element[] = [];
  disconnected = false;

  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    ResizeObserverMock.instances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }

  unobserve(el: Element) {
    this.observed = this.observed.filter((e) => e !== el);
  }

  disconnect() {
    this.disconnected = true;
    this.observed = [];
  }

  trigger(el: Element) {
    if (this.disconnected) return;
    const entry = {
      target: el,
      contentRect: { width: 0, height: 0 } as DOMRectReadOnly,
      contentBoxSize: [],
      borderBoxSize: [],
      devicePixelContentBoxSize: [],
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this);
  }
}

// ---------------------------------------------------------------------------
// MutationObserver mock
// ---------------------------------------------------------------------------

class MutationObserverMock {
  static instances: MutationObserverMock[] = [];
  callback: MutationCallback;
  disconnected = false;

  constructor(cb: MutationCallback) {
    this.callback = cb;
    MutationObserverMock.instances.push(this);
  }

  observe(_el: Element, _opts?: MutationObserverInit) {}

  disconnect() {
    this.disconnected = true;
  }

  takeRecords(): MutationRecord[] {
    return [];
  }

  trigger(records: Partial<MutationRecord>[] = [{}]) {
    if (this.disconnected) return;
    this.callback(records as MutationRecord[], this);
  }
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  ResizeObserverMock.instances = [];
  MutationObserverMock.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal("MutationObserver", MutationObserverMock);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// Flush all pending requestAnimationFrame callbacks
function flushRaf() {
  vi.runAllTimers();
}

// Create a div with a mocked getBoundingClientRect
function createDivWithRect(rect: Partial<DOMRect> = {}) {
  const div = document.createElement("div");
  const full: DOMRect = {
    x: 10,
    y: 20,
    top: 20,
    right: 210,
    bottom: 120,
    left: 10,
    width: 200,
    height: 100,
    toJSON: () => ({}),
    ...rect,
  };
  vi.spyOn(div, "getBoundingClientRect").mockReturnValue(full);
  return div;
}

// ---------------------------------------------------------------------------
// useElementBounding — core functionality
// ---------------------------------------------------------------------------

describe("useElementBounding()", () => {
  describe("initial values", () => {
    it("returns Observable with width, height, x, y, top, right, bottom, left", () => {
      const div = createDivWithRect();
      const { result } = renderHook(() =>
        useElementBounding(wrapEl(div) as any, { useCssTransforms: false })
      );

      expect(typeof result.current.x$.get).toBe("function");
      expect(typeof result.current.y$.get).toBe("function");
      expect(typeof result.current.top$.get).toBe("function");
      expect(typeof result.current.right$.get).toBe("function");
      expect(typeof result.current.bottom$.get).toBe("function");
      expect(typeof result.current.left$.get).toBe("function");
      expect(typeof result.current.width$.get).toBe("function");
      expect(typeof result.current.height$.get).toBe("function");
      expect(typeof result.current.update).toBe("function");
    });

    it("initial values are all 0 when target is null", () => {
      const { result } = renderHook(() =>
        useElementBounding(null as any, { useCssTransforms: false })
      );

      expect(result.current.x$.get()).toBe(0);
      expect(result.current.y$.get()).toBe(0);
      expect(result.current.top$.get()).toBe(0);
      expect(result.current.right$.get()).toBe(0);
      expect(result.current.bottom$.get()).toBe(0);
      expect(result.current.left$.get()).toBe(0);
      expect(result.current.width$.get()).toBe(0);
      expect(result.current.height$.get()).toBe(0);
    });
  });

  describe("core behavior", () => {
    it("reads getBoundingClientRect on mount", () => {
      const div = createDivWithRect({ width: 200, height: 100, x: 10, y: 20 });

      const { result } = renderHook(() =>
        useElementBounding(wrapEl(div) as any, { useCssTransforms: false })
      );

      expect(div.getBoundingClientRect).toHaveBeenCalled();
      expect(result.current.width$.get()).toBe(200);
      expect(result.current.height$.get()).toBe(100);
      expect(result.current.x$.get()).toBe(10);
      expect(result.current.y$.get()).toBe(20);
    });

    it("reads getBoundingClientRect via RAF on mount when useCssTransforms is true (default)", () => {
      const div = createDivWithRect({ width: 300, height: 150 });

      const { result } = renderHook(() => useElementBounding(wrapEl(div) as any));

      // Before RAF flush: values are 0 (no sync read)
      // After RAF flush: values updated
      act(() => flushRaf());

      expect(div.getBoundingClientRect).toHaveBeenCalled();
      expect(result.current.width$.get()).toBe(300);
      expect(result.current.height$.get()).toBe(150);
    });

    it("updates values when ResizeObserver fires", () => {
      const div = createDivWithRect({ width: 200, height: 100 });

      const { result } = renderHook(() =>
        useElementBounding(wrapEl(div) as any, { useCssTransforms: false })
      );

      // Update mock return value for next call
      vi.spyOn(div, "getBoundingClientRect").mockReturnValue({
        x: 0, y: 0, top: 0, right: 400, bottom: 300,
        left: 0, width: 400, height: 300, toJSON: () => ({}),
      });

      const roInstance = ResizeObserverMock.instances.find(
        (i) => !i.disconnected && i.observed.includes(div)
      );
      expect(roInstance).toBeDefined();

      act(() => roInstance!.trigger(div));

      expect(result.current.width$.get()).toBe(400);
      expect(result.current.height$.get()).toBe(300);
    });

    it("updates values when MutationObserver fires", () => {
      const div = createDivWithRect({ width: 200, height: 100 });

      const { result } = renderHook(() =>
        useElementBounding(wrapEl(div) as any, { useCssTransforms: false })
      );

      vi.spyOn(div, "getBoundingClientRect").mockReturnValue({
        x: 5, y: 10, top: 10, right: 505, bottom: 210,
        left: 5, width: 500, height: 200, toJSON: () => ({}),
      });

      const moInstance = MutationObserverMock.instances.find((i) => !i.disconnected);
      expect(moInstance).toBeDefined();

      act(() => moInstance!.trigger());

      expect(result.current.width$.get()).toBe(500);
      expect(result.current.height$.get()).toBe(200);
    });

    it("updates values on window scroll event", () => {
      const div = createDivWithRect({ width: 200, height: 100, top: 20 });

      const { result } = renderHook(() =>
        useElementBounding(wrapEl(div) as any, { useCssTransforms: false })
      );

      vi.spyOn(div, "getBoundingClientRect").mockReturnValue({
        x: 0, y: 50, top: 50, right: 200, bottom: 150,
        left: 0, width: 200, height: 100, toJSON: () => ({}),
      });

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current.top$.get()).toBe(50);
      expect(result.current.y$.get()).toBe(50);
    });

    it("updates values on window resize event", () => {
      const div = createDivWithRect({ width: 200, height: 100 });

      const { result } = renderHook(() =>
        useElementBounding(wrapEl(div) as any, { useCssTransforms: false })
      );

      vi.spyOn(div, "getBoundingClientRect").mockReturnValue({
        x: 0, y: 0, top: 0, right: 800, bottom: 400,
        left: 0, width: 800, height: 400, toJSON: () => ({}),
      });

      act(() => {
        window.dispatchEvent(new Event("resize"));
      });

      expect(result.current.width$.get()).toBe(800);
      expect(result.current.height$.get()).toBe(400);
    });
  });

  describe("null target guard", () => {
    it("does not observe when target is null", () => {
      renderHook(() =>
        useElementBounding(null as any, { useCssTransforms: false })
      );

      // ResizeObserver and MutationObserver may still be created but should not be observing any element
      const observingRO = ResizeObserverMock.instances.filter(
        (i) => i.observed.length > 0
      );
      expect(observingRO).toHaveLength(0);
    });

    it("does not throw when target is null", () => {
      expect(() => {
        renderHook(() => useElementBounding(null as any));
      }).not.toThrow();
    });
  });

  describe("unmount cleanup", () => {
    it("cleans up all resources on unmount", () => {
      const div = createDivWithRect();
      const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { result, unmount } = renderHook(() =>
        useElementBounding(wrapEl(div) as any)
      );

      // Flush the mount RAF
      act(() => flushRaf());

      // Trigger update() to queue a new RAF before unmount
      act(() => result.current.update());

      unmount();

      // RO disconnected
      const disconnectedRO = ResizeObserverMock.instances.filter((i) => i.disconnected);
      expect(disconnectedRO.length).toBeGreaterThan(0);

      // MO disconnected
      const disconnectedMO = MutationObserverMock.instances.filter((i) => i.disconnected);
      expect(disconnectedMO.length).toBeGreaterThan(0);

      // window scroll/resize listeners removed
      const scrollRemoved = removeSpy.mock.calls.some(([event]) => event === "scroll");
      const resizeRemoved = removeSpy.mock.calls.some(([event]) => event === "resize");
      expect(scrollRemoved).toBe(true);
      expect(resizeRemoved).toBe(true);

      // cancelAnimationFrame was called for pending RAF
      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it("resets bounding values to zero on unmount (reset=true by default)", () => {
      const div = createDivWithRect({ width: 200, height: 100 });

      const { result, unmount } = renderHook(() =>
        useElementBounding(wrapEl(div) as any, { useCssTransforms: false })
      );

      // Values should be populated after mount
      expect(result.current.width$.get()).toBe(200);

      unmount();

      expect(result.current.width$.get()).toBe(0);
      expect(result.current.height$.get()).toBe(0);
    });

    it("does not reset bounding values on unmount when reset=false", () => {
      const div = createDivWithRect({ width: 200, height: 100 });

      const { result, unmount } = renderHook(() =>
        useElementBounding(wrapEl(div) as any, { useCssTransforms: false, reset: false })
      );

      expect(result.current.width$.get()).toBe(200);

      unmount();

      expect(result.current.width$.get()).toBe(200);
      expect(result.current.height$.get()).toBe(100);
    });
  });
});
