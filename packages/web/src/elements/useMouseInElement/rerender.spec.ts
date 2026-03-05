// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMouseInElement } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

function createDiv(rect: Partial<DOMRect> = {}) {
  const div = document.createElement("div");
  const full: DOMRect = {
    left: 0,
    top: 0,
    right: 200,
    bottom: 100,
    width: 200,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  };
  vi.spyOn(div, "getClientRects").mockReturnValue([full] as unknown as DOMRectList);
  return div;
}

function fireMouseMove(x: number, y: number) {
  act(() => {
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
  });
}

// ---------------------------------------------------------------------------
// Mocks: ResizeObserver, MutationObserver
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
}

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

beforeEach(() => {
  ResizeObserverMock.instances = [];
  MutationObserverMock.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal("MutationObserver", MutationObserverMock);
  Object.defineProperty(window, "scrollX", { value: 0, configurable: true });
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// useMouseInElement — rerender stability
// ---------------------------------------------------------------------------

describe("useMouseInElement() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-register event listeners when unrelated state causes re-render", () => {
      const div = createDiv();
      const addSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMouseInElement(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      // Capture call count after initial mount
      const addCountAfterMount = addSpy.mock.calls.length;

      // Re-render with unrelated prop changes
      rerender({ count: 1 });
      rerender({ count: 2 });

      // No new addEventListener calls should have been made
      expect(addSpy.mock.calls.length).toBe(addCountAfterMount);
    });

    it("does not re-create ResizeObserver or MutationObserver on re-render", () => {
      const div = createDiv();

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMouseInElement(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      const roCountAfterMount = ResizeObserverMock.instances.length;
      const moCountAfterMount = MutationObserverMock.instances.length;

      rerender({ count: 1 });
      rerender({ count: 2 });

      expect(ResizeObserverMock.instances.length).toBe(roCountAfterMount);
      expect(MutationObserverMock.instances.length).toBe(moCountAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("mouse position values remain accurate after re-render", () => {
      const div = createDiv({
        left: 0,
        top: 0,
        right: 200,
        bottom: 100,
        width: 200,
        height: 100,
      });

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMouseInElement(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      // Move mouse inside
      fireMouseMove(50, 40);
      expect(result.current.elementX$.get()).toBe(50);
      expect(result.current.elementY$.get()).toBe(40);
      expect(result.current.isOutside$.get()).toBe(false);

      // Trigger re-render
      rerender({ count: 1 });

      // Values must remain the same after re-render
      expect(result.current.elementX$.get()).toBe(50);
      expect(result.current.elementY$.get()).toBe(40);
      expect(result.current.isOutside$.get()).toBe(false);
      expect(result.current.x$.get()).toBe(50);
      expect(result.current.y$.get()).toBe(40);
    });
  });

  describe("callback freshness", () => {
    it("mousemove event still updates position correctly after re-render", () => {
      const div = createDiv({
        left: 0,
        top: 0,
        right: 200,
        bottom: 100,
        width: 200,
        height: 100,
      });

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useMouseInElement(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      // Move mouse before re-render
      fireMouseMove(30, 20);
      expect(result.current.x$.get()).toBe(30);

      // Trigger re-render
      rerender({ count: 1 });

      // Move mouse after re-render — should still update correctly
      fireMouseMove(80, 60);
      expect(result.current.x$.get()).toBe(80);
      expect(result.current.y$.get()).toBe(60);
      expect(result.current.elementX$.get()).toBe(80);
      expect(result.current.elementY$.get()).toBe(60);
      expect(result.current.isOutside$.get()).toBe(false);
    });
  });
});
