// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRef$ } from "../useRef$";
import { useElementSize } from ".";

const wrapEl = (el: Element) =>
  observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

// ---------------------------------------------------------------------------
// ResizeObserver mock (extended with box size support)
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

  /**
   * Trigger the callback with a configurable fake entry.
   * All box size arrays default to empty (falling back to contentRect).
   */
  trigger(
    el: Element,
    options: {
      contentRect?: Partial<DOMRectReadOnly>;
      contentBoxSize?: BoxSize[];
      borderBoxSize?: BoxSize[];
      devicePixelContentBoxSize?: BoxSize[];
    } = {},
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
// useElementSize
// ---------------------------------------------------------------------------

describe("useElementSize()", () => {
  it("updates width and height on resize event (contentRect fallback)", () => {
    const div = document.createElement("div");

    const { result } = renderHook(() => useElementSize(wrapEl(div) as any));

    const instance = ResizeObserverMock.instances.at(-1)!;
    act(() =>
      instance.trigger(div, { contentRect: { width: 320, height: 240 } }),
    );

    expect(result.current.width$.get()).toBe(320);
    expect(result.current.height$.get()).toBe(240);
  });

  it("uses getBoundingClientRect() for SVG elements", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
      width: 150,
      height: 75,
      top: 0,
      left: 0,
      bottom: 75,
      right: 150,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const { result } = renderHook(() => useElementSize(wrapEl(svg) as any));

    const instance = ResizeObserverMock.instances.at(-1)!;
    act(() => instance.trigger(svg));

    expect(svg.getBoundingClientRect).toHaveBeenCalled();
    expect(result.current.width$.get()).toBe(150);
    expect(result.current.height$.get()).toBe(75);
  });

  it("reads borderBoxSize when box option is 'border-box'", () => {
    const div = document.createElement("div");

    const { result } = renderHook(() =>
      useElementSize(wrapEl(div) as any, undefined, { box: "border-box" }),
    );

    const instance = ResizeObserverMock.instances.at(-1)!;
    act(() =>
      instance.trigger(div, {
        borderBoxSize: [{ inlineSize: 400, blockSize: 300 }],
      }),
    );

    expect(result.current.width$.get()).toBe(400);
    expect(result.current.height$.get()).toBe(300);
  });

  it("reads devicePixelContentBoxSize when box option is 'device-pixel-content-box'", () => {
    const div = document.createElement("div");

    const { result } = renderHook(() =>
      useElementSize(wrapEl(div) as any, undefined, {
        box: "device-pixel-content-box",
      }),
    );

    const instance = ResizeObserverMock.instances.at(-1)!;
    act(() =>
      instance.trigger(div, {
        devicePixelContentBoxSize: [{ inlineSize: 800, blockSize: 600 }],
      }),
    );

    expect(result.current.width$.get()).toBe(800);
    expect(result.current.height$.get()).toBe(600);
  });

  it("falls back to contentBoxSize when present and no specific box matched", () => {
    const div = document.createElement("div");

    // default box is "content-box" — reads contentBoxSize
    const { result } = renderHook(() => useElementSize(wrapEl(div) as any));

    const instance = ResizeObserverMock.instances.at(-1)!;
    act(() =>
      instance.trigger(div, {
        contentBoxSize: [{ inlineSize: 500, blockSize: 250 }],
      }),
    );

    expect(result.current.width$.get()).toBe(500);
    expect(result.current.height$.get()).toBe(250);
  });

  it("falls back to contentRect when no boxSize arrays are present", () => {
    const div = document.createElement("div");

    const { result } = renderHook(() => useElementSize(wrapEl(div) as any));

    const instance = ResizeObserverMock.instances.at(-1)!;
    act(() =>
      instance.trigger(div, { contentRect: { width: 123, height: 456 } }),
    );

    expect(result.current.width$.get()).toBe(123);
    expect(result.current.height$.get()).toBe(456);
  });

  it("returns initialSize when target is null", () => {
    const { result } = renderHook(() =>
      useElementSize(null as any, { width: 10, height: 20 }),
    );

    expect(result.current.width$.get()).toBe(10);
    expect(result.current.height$.get()).toBe(20);
  });

  it("returns default initialSize { width: 0, height: 0 } when no initialSize provided and target is null", () => {
    const { result } = renderHook(() => useElementSize(null as any));

    expect(result.current.width$.get()).toBe(0);
    expect(result.current.height$.get()).toBe(0);
  });

  it("stop() suppresses further size updates", () => {
    const div = document.createElement("div");

    const { result } = renderHook(() => useElementSize(wrapEl(div) as any));

    const instance = ResizeObserverMock.instances.at(-1)!;

    // Trigger first resize — should update
    act(() =>
      instance.trigger(div, { contentRect: { width: 100, height: 100 } }),
    );
    expect(result.current.width$.get()).toBe(100);

    // Stop observing
    act(() => result.current.stop());

    // Trigger again — instance is disconnected, trigger() is a no-op
    act(() =>
      instance.trigger(div, { contentRect: { width: 999, height: 999 } }),
    );
    expect(result.current.width$.get()).toBe(100);
    expect(result.current.height$.get()).toBe(100);
  });

  it("Ref$ target: sets offsetWidth/offsetHeight as initial size after element is assigned", () => {
    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const size = useElementSize(el$);
      return { el$, size };
    });

    // Before assignment — initial values
    expect(result.current.size.width$.get()).toBe(0);
    expect(result.current.size.height$.get()).toBe(0);

    const div = document.createElement("div");
    // jsdom returns 0 for offsetWidth/Height by default, but we can override
    Object.defineProperty(div, "offsetWidth", { value: 640, configurable: true });
    Object.defineProperty(div, "offsetHeight", { value: 480, configurable: true });

    act(() => result.current.el$(div));

    expect(result.current.size.width$.get()).toBe(640);
    expect(result.current.size.height$.get()).toBe(480);
  });

  it("resets to initialSize when target Ref$ becomes null", () => {
    const div = document.createElement("div");

    const { result } = renderHook(() => {
      const el$ = useRef$<HTMLDivElement>();
      const size = useElementSize(el$, { width: 5, height: 10 });
      return { el$, size };
    });

    // Assign element first
    act(() => result.current.el$(div));

    // Then set element to null (passing null simulates unmounting)
    act(() => result.current.el$(null));

    expect(result.current.size.width$.get()).toBe(5);
    expect(result.current.size.height$.get()).toBe(10);
  });

  it("accumulates multiple borderBoxSize entries", () => {
    const div = document.createElement("div");

    const { result } = renderHook(() =>
      useElementSize(wrapEl(div) as any, undefined, { box: "border-box" }),
    );

    const instance = ResizeObserverMock.instances.at(-1)!;
    act(() =>
      instance.trigger(div, {
        borderBoxSize: [
          { inlineSize: 100, blockSize: 50 },
          { inlineSize: 200, blockSize: 100 },
        ],
      }),
    );

    // Accumulated: 100+200=300, 50+100=150
    expect(result.current.width$.get()).toBe(300);
    expect(result.current.height$.get()).toBe(150);
  });
});
