// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useResizeObserver } from ".";

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

  /** Helper: trigger the callback with a fake entry for the given element */
  trigger(el: Element, rect: Partial<DOMRectReadOnly> = {}) {
    if (this.disconnected) return;
    const entry = {
      target: el,
      contentRect: { width: 100, height: 100, ...rect } as DOMRectReadOnly,
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
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
// useResizeObserver — rerender stability
// ---------------------------------------------------------------------------

describe("useResizeObserver() — rerender stability", () => {
  describe("callback freshness", () => {
    it("uses the latest callback without recreating the observer on re-render", () => {
      const div = document.createElement("div");
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const { rerender } = renderHook(({ cb }) => useResizeObserver(wrapEl(div), cb), {
        initialProps: { cb: cb1 },
      });

      const instance = ResizeObserverMock.instances.at(-1)!;

      rerender({ cb: cb2 });

      // Observer must NOT be recreated — same instance as before
      expect(ResizeObserverMock.instances.at(-1)).toBe(instance);

      // Triggering should invoke the latest callback (cb2), not the stale one (cb1)
      act(() => instance.trigger(div));
      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledOnce();
    });
  });

  describe("resource stability", () => {
    it("does not re-create ResizeObserver when unrelated state causes re-render", () => {
      const div = document.createElement("div");
      const disconnectSpy = vi.spyOn(ResizeObserverMock.prototype, "disconnect");

      const { rerender } = renderHook(() => useResizeObserver(wrapEl(div), vi.fn()));

      const instanceCountAfterMount = ResizeObserverMock.instances.length;
      const disconnectCallsAfterMount = disconnectSpy.mock.calls.length;

      // Multiple rerenders with same props
      rerender();
      rerender();
      rerender();

      // No new ResizeObserver instances should have been created
      expect(ResizeObserverMock.instances.length).toBe(instanceCountAfterMount);
      // No disconnect calls should have happened due to rerenders
      expect(disconnectSpy.mock.calls.length).toBe(disconnectCallsAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("observer continues to fire after multiple re-renders", () => {
      const div = document.createElement("div");
      const cb = vi.fn();

      const { rerender } = renderHook(() => useResizeObserver(wrapEl(div), cb));

      rerender();
      rerender();
      rerender();

      const instance = ResizeObserverMock.instances.at(-1)!;
      act(() => instance.trigger(div, { width: 200, height: 150 }));

      expect(cb).toHaveBeenCalledOnce();
      const entries: ResizeObserverEntry[] = cb.mock.calls[0][0];
      expect(entries[0].contentRect.width).toBe(200);
      expect(entries[0].contentRect.height).toBe(150);
    });
  });
});
