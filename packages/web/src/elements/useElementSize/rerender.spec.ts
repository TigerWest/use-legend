// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useElementSize } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

// ---------------------------------------------------------------------------
// ResizeObserver mock
// ---------------------------------------------------------------------------

type BoxSize = { inlineSize: number; blockSize: number };

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

  trigger(
    el: Element,
    options: {
      contentRect?: Partial<DOMRectReadOnly>;
      contentBoxSize?: BoxSize[];
      borderBoxSize?: BoxSize[];
      devicePixelContentBoxSize?: BoxSize[];
    } = {}
  ) {
    if (this.disconnected) return;
    const entry = {
      target: el,
      contentRect: {
        width: 100,
        height: 200,
        ...options.contentRect,
      } as DOMRectReadOnly,
      contentBoxSize: options.contentBoxSize ?? [],
      borderBoxSize: options.borderBoxSize ?? [],
      devicePixelContentBoxSize: options.devicePixelContentBoxSize ?? [],
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this);
  }
}

beforeEach(() => {
  ResizeObserverMock.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// useElementSize — rerender stability
// ---------------------------------------------------------------------------

describe("useElementSize() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not re-create ResizeObserver when unrelated state causes re-render", () => {
      const div = document.createElement("div");

      const { rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementSize(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      const instanceAfterMount = ResizeObserverMock.instances.at(-1)!;
      const instanceCountAfterMount = ResizeObserverMock.instances.length;

      rerender({ count: 1 });
      rerender({ count: 2 });

      expect(ResizeObserverMock.instances.length).toBe(instanceCountAfterMount);
      expect(ResizeObserverMock.instances.at(-1)).toBe(instanceAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("width$ and height$ remain accurate after re-render", () => {
      const div = document.createElement("div");

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementSize(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      const instance = ResizeObserverMock.instances.at(-1)!;
      act(() => instance.trigger(div, { contentRect: { width: 320, height: 240 } }));

      expect(result.current.width$.get()).toBe(320);
      expect(result.current.height$.get()).toBe(240);

      rerender({ count: 1 });

      expect(result.current.width$.get()).toBe(320);
      expect(result.current.height$.get()).toBe(240);
    });
  });

  describe("callback freshness", () => {
    it("ResizeObserver callback still fires correctly after re-render", () => {
      const div = document.createElement("div");

      const { result, rerender } = renderHook(
        (props: { count: number }) => {
          void props.count;
          return useElementSize(wrapEl(div) as any);
        },
        { initialProps: { count: 0 } }
      );

      // Trigger resize before re-render
      const instance = ResizeObserverMock.instances.at(-1)!;
      act(() => instance.trigger(div, { contentRect: { width: 100, height: 100 } }));

      // Trigger re-render
      rerender({ count: 1 });

      // Trigger resize after re-render — should still update
      act(() => instance.trigger(div, { contentRect: { width: 500, height: 400 } }));

      expect(result.current.width$.get()).toBe(500);
      expect(result.current.height$.get()).toBe(400);
    });
  });
});
