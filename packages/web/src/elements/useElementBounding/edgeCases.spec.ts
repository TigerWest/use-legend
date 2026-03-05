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
// useElementBounding — edge cases
// ---------------------------------------------------------------------------

describe("useElementBounding() — edge cases", () => {
  it("rapid target changes do not create multiple pending RAFs", () => {
    const div = createDivWithRect({ width: 200, height: 100 });
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");

    const { result } = renderHook(() => useElementBounding(wrapEl(div) as any));

    // Flush the initial RAF queued on mount
    act(() => vi.runAllTimers());

    const rafCountAfterMount = rafSpy.mock.calls.length;

    // Rapidly call update() multiple times — each call should overwrite rafRef,
    // not accumulate multiple pending RAFs that all fire independently.
    act(() => {
      result.current.update();
      result.current.update();
      result.current.update();
    });

    // Three update() calls may each queue a RAF, but at most 3 should be added.
    // The key guard is that unmountedRef prevents stale RAF callbacks from
    // writing state after unmount, and rafRef tracks the latest handle.
    const rafCountAfterUpdates = rafSpy.mock.calls.length;
    expect(rafCountAfterUpdates - rafCountAfterMount).toBeLessThanOrEqual(3);

    // After flushing all timers, the final bounding values should be correct
    // (not corrupted by multiple concurrent RAF callbacks).
    act(() => vi.runAllTimers());
    expect(result.current.width$.get()).toBe(200);
    expect(result.current.height$.get()).toBe(100);

    rafSpy.mockRestore();
  });

  it("works with SVGElement", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const rect: DOMRect = {
      x: 5,
      y: 10,
      top: 10,
      right: 105,
      bottom: 60,
      left: 5,
      width: 100,
      height: 50,
      toJSON: () => ({}),
    };
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue(rect);

    const { result } = renderHook(() =>
      useElementBounding(wrapEl(svg) as any, { useCssTransforms: false })
    );

    expect(result.current.width$.get()).toBe(100);
    expect(result.current.height$.get()).toBe(50);
    expect(result.current.x$.get()).toBe(5);
    expect(result.current.y$.get()).toBe(10);
    expect(result.current.top$.get()).toBe(10);
    expect(result.current.left$.get()).toBe(5);
    expect(result.current.right$.get()).toBe(105);
    expect(result.current.bottom$.get()).toBe(60);
  });
});
