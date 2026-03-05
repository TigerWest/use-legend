// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
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
}

beforeEach(() => {
  ResizeObserverMock.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// useResizeObserver — edge cases
// ---------------------------------------------------------------------------

describe("useResizeObserver() — edge cases", () => {
  it("empty target array does not create observer", () => {
    renderHook(() => useResizeObserver([], vi.fn()));

    const activeInstances = ResizeObserverMock.instances.filter((i) => i.observed.length > 0);
    expect(activeInstances).toHaveLength(0);
  });

  it("works with SVGElement", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const cb = vi.fn();

    renderHook(() => useResizeObserver(wrapEl(svg), cb));

    const instance = ResizeObserverMock.instances.find((i) => i.observed.includes(svg));
    expect(instance).toBeDefined();
  });
});
