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

/**
 * Create a div whose getClientRects() returns a single rect at the given position.
 * Defaults: left=0, top=0, right=200, bottom=100, width=200, height=100
 */
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
// useMouseInElement tests
// ---------------------------------------------------------------------------

describe("useMouseInElement()", () => {
  it("initial state: all zeros and isOutside = true", () => {
    const div = createDiv();
    const { result } = renderHook(() => useMouseInElement(wrapEl(div) as any));

    expect(result.current.elementX$.get()).toBe(0);
    expect(result.current.elementY$.get()).toBe(0);
    expect(result.current.elementPositionX$.get()).toBe(0);
    expect(result.current.elementPositionY$.get()).toBe(0);
    expect(result.current.elementWidth$.get()).toBe(0);
    expect(result.current.elementHeight$.get()).toBe(0);
    expect(result.current.isOutside$.get()).toBe(true);
    expect(result.current.x$.get()).toBe(0);
    expect(result.current.y$.get()).toBe(0);
  });

  it("exposes raw clientX/clientY as x and y", () => {
    const div = createDiv();
    const { result } = renderHook(() => useMouseInElement(wrapEl(div) as any));

    fireMouseMove(350, 420);

    expect(result.current.x$.get()).toBe(350);
    expect(result.current.y$.get()).toBe(420);
  });

  it("elementPositionX/Y includes window.scrollX/scrollY", () => {
    Object.defineProperty(window, "scrollX", { value: 100, configurable: true });
    Object.defineProperty(window, "scrollY", { value: 200, configurable: true });

    const div = createDiv({
      left: 10,
      top: 20,
      right: 210,
      bottom: 120,
      width: 200,
      height: 100,
    });
    const { result } = renderHook(() => useMouseInElement(wrapEl(div) as any));

    fireMouseMove(60, 70); // inside

    // elementPositionX = rect.left + scrollX = 10 + 100 = 110
    expect(result.current.elementPositionX$.get()).toBe(110);
    // elementPositionY = rect.top + scrollY = 20 + 200 = 220
    expect(result.current.elementPositionY$.get()).toBe(220);
  });

  it("exposes elementWidth and elementHeight from matched rect", () => {
    const div = createDiv({
      left: 0,
      top: 0,
      right: 300,
      bottom: 150,
      width: 300,
      height: 150,
    });
    const { result } = renderHook(() => useMouseInElement(wrapEl(div) as any));

    fireMouseMove(50, 50); // inside

    expect(result.current.elementWidth$.get()).toBe(300);
    expect(result.current.elementHeight$.get()).toBe(150);
  });

  it("handleOutside: true (default) — still updates elementX/Y when outside", () => {
    const div = createDiv({
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
    });
    const { result } = renderHook(() =>
      useMouseInElement(wrapEl(div) as any, { handleOutside: true })
    );

    fireMouseMove(300, 400); // outside: elementX = 300-0, elementY = 400-0

    expect(result.current.isOutside$.get()).toBe(true);
    expect(result.current.elementX$.get()).toBe(300);
    expect(result.current.elementY$.get()).toBe(400);
  });

  it("handleOutside: false — elementX/Y frozen at last inside position after leaving", () => {
    const div = createDiv({
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
    });
    const { result } = renderHook(() =>
      useMouseInElement(wrapEl(div) as any, { handleOutside: false })
    );

    fireMouseMove(80, 60); // inside
    expect(result.current.elementX$.get()).toBe(80);
    expect(result.current.elementY$.get()).toBe(60);

    fireMouseMove(500, 500); // outside — should NOT update elementX/Y
    expect(result.current.isOutside$.get()).toBe(true);
    expect(result.current.elementX$.get()).toBe(80);
    expect(result.current.elementY$.get()).toBe(60);
  });

  it("document mouseleave → sets isOutside = true regardless of cursor position", () => {
    const div = createDiv({
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
    });
    const { result } = renderHook(() => useMouseInElement(wrapEl(div) as any));

    fireMouseMove(50, 50); // inside
    expect(result.current.isOutside$.get()).toBe(false);

    act(() => {
      document.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    });

    expect(result.current.isOutside$.get()).toBe(true);
  });

  it("windowScroll: false — scroll event does not trigger recalculation", () => {
    const div = createDiv();
    const spy = vi.spyOn(div, "getClientRects");
    renderHook(() => useMouseInElement(wrapEl(div) as any, { windowScroll: false }));

    const before = spy.mock.calls.length;

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(spy.mock.calls.length).toBe(before);
  });

  it("resize event triggers recalculation (windowResize: true by default)", () => {
    const div = createDiv();
    const spy = vi.spyOn(div, "getClientRects");
    renderHook(() => useMouseInElement(wrapEl(div) as any));

    const before = spy.mock.calls.length;

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(spy.mock.calls.length).toBeGreaterThan(before);
  });

  it("windowResize: false — resize event does not trigger recalculation", () => {
    const div = createDiv();
    const spy = vi.spyOn(div, "getClientRects");
    renderHook(() => useMouseInElement(wrapEl(div) as any, { windowResize: false }));

    const before = spy.mock.calls.length;

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(spy.mock.calls.length).toBe(before);
  });

  it("stop() disconnects ResizeObserver and MutationObserver", () => {
    const div = createDiv();
    const { result } = renderHook(() => useMouseInElement(wrapEl(div) as any));

    act(() => result.current.stop());

    expect(ResizeObserverMock.instances.some((i) => i.disconnected)).toBe(true);
    expect(MutationObserverMock.instances.some((i) => i.disconnected)).toBe(true);
  });

  it("stop() removes mousemove listener — state does not update afterwards", () => {
    const div = createDiv({
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
    });
    const { result } = renderHook(() => useMouseInElement(wrapEl(div) as any));

    fireMouseMove(80, 60); // inside
    expect(result.current.elementX$.get()).toBe(80);

    act(() => result.current.stop());

    // Dispatch mousemove after stop — listener should be removed
    act(() => {
      window.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 10,
          clientY: 10,
          bubbles: true,
        })
      );
    });

    // x/y raw values should not have updated
    expect(result.current.x$.get()).toBe(80);
    expect(result.current.y$.get()).toBe(60);
  });

  it("does not throw when target is null", () => {
    expect(() => {
      renderHook(() => useMouseInElement(null as any));
    }).not.toThrow();
  });

  it("skips update when getClientRects returns empty (no layout)", () => {
    const div = document.createElement("div");
    vi.spyOn(div, "getClientRects").mockReturnValue([] as unknown as DOMRectList);
    const { result } = renderHook(() => useMouseInElement(wrapEl(div) as any));

    fireMouseMove(50, 50);

    // No rect → state stays at initial values
    expect(result.current.isOutside$.get()).toBe(true);
    expect(result.current.elementX$.get()).toBe(0);
    expect(result.current.elementY$.get()).toBe(0);
  });
});
