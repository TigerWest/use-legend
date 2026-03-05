// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useElementBounding } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

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

function createDivWithRect(rect: Partial<DOMRect> = {}) {
  const div = document.createElement("div");
  const full: DOMRect = {
    x: 0,
    y: 0,
    top: 0,
    right: 200,
    bottom: 100,
    left: 0,
    width: 200,
    height: 100,
    toJSON: () => ({}),
    ...rect,
  };
  vi.spyOn(div, "getBoundingClientRect").mockReturnValue(full);
  return div;
}

// ---------------------------------------------------------------------------
// useElementBounding — rerender stability
// ---------------------------------------------------------------------------

describe("useElementBounding() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-create ResizeObserver when unrelated state causes re-render", () => {
      const div = createDivWithRect();

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementBounding(wrapEl(div) as any, { useCssTransforms: false });
        },
        { initialProps: { count: 0 } }
      );

      const countAfterMount = ResizeObserverMock.instances.length;
      const instanceAfterMount = ResizeObserverMock.instances.at(-1)!;

      rerender({ count: 1 });
      rerender({ count: 2 });

      expect(ResizeObserverMock.instances.length).toBe(countAfterMount);
      expect(ResizeObserverMock.instances.at(-1)).toBe(instanceAfterMount);
    });

    it("does not re-create MutationObserver when unrelated state causes re-render", () => {
      const div = createDivWithRect();

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementBounding(wrapEl(div) as any, { useCssTransforms: false });
        },
        { initialProps: { count: 0 } }
      );

      const countAfterMount = MutationObserverMock.instances.length;
      const instanceAfterMount = MutationObserverMock.instances.at(-1)!;

      rerender({ count: 1 });
      rerender({ count: 2 });

      expect(MutationObserverMock.instances.length).toBe(countAfterMount);
      expect(MutationObserverMock.instances.at(-1)).toBe(instanceAfterMount);
    });

    it("does not re-register scroll/resize listeners when unrelated state causes re-render", () => {
      const div = createDivWithRect();
      const addSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementBounding(wrapEl(div) as any, { useCssTransforms: false });
        },
        { initialProps: { count: 0 } }
      );

      const scrollAddsAfterMount = addSpy.mock.calls.filter(([e]) => e === "scroll").length;
      const resizeAddsAfterMount = addSpy.mock.calls.filter(([e]) => e === "resize").length;

      rerender({ count: 1 });
      rerender({ count: 2 });

      const scrollAddsAfterRerender = addSpy.mock.calls.filter(([e]) => e === "scroll").length;
      const resizeAddsAfterRerender = addSpy.mock.calls.filter(([e]) => e === "resize").length;

      expect(scrollAddsAfterRerender).toBe(scrollAddsAfterMount);
      expect(resizeAddsAfterRerender).toBe(resizeAddsAfterMount);

      addSpy.mockRestore();
    });

    it("pending RAF is not duplicated after re-render", () => {
      const div = createDivWithRect();
      const rafSpy = vi.spyOn(window, "requestAnimationFrame");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementBounding(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      // Flush initial RAF from mount
      act(() => vi.runAllTimers());

      const rafCallsAfterMount = rafSpy.mock.calls.length;

      rerender({ count: 1 });

      // RAF should not be invoked just from re-rendering
      expect(rafSpy.mock.calls.length).toBe(rafCallsAfterMount);

      rafSpy.mockRestore();
    });
  });

  describe("value accuracy", () => {
    it("bounding values remain accurate after re-render", () => {
      const div = createDivWithRect({ width: 320, height: 240, x: 10, y: 20 });

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementBounding(wrapEl(div) as any, { useCssTransforms: false });
        },
        { initialProps: { count: 0 } }
      );

      expect(result.current.width$.get()).toBe(320);
      expect(result.current.height$.get()).toBe(240);
      expect(result.current.x$.get()).toBe(10);
      expect(result.current.y$.get()).toBe(20);

      rerender({ count: 1 });

      expect(result.current.width$.get()).toBe(320);
      expect(result.current.height$.get()).toBe(240);
      expect(result.current.x$.get()).toBe(10);
      expect(result.current.y$.get()).toBe(20);
    });
  });
});
