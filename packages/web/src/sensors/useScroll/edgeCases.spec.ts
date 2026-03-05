// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useScroll } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

function makeEl(
  overrides: Partial<{
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  }> = {}
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

// ---------------------------------------------------------------------------
// useScroll — edge cases
// ---------------------------------------------------------------------------

describe("useScroll() — edge cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "scrollX", { writable: true, configurable: true, value: 0 });
    Object.defineProperty(window, "scrollY", { writable: true, configurable: true, value: 0 });
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });
    Object.defineProperty(document.documentElement, "scrollWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      writable: true,
      configurable: true,
      value: 2000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns x=0, y=0 without error when null target is passed", () => {
    const { result } = renderHook(() => useScroll(null));
    expect(result.current.x$.get()).toBe(0);
    expect(result.current.y$.get()).toBe(0);
  });

  it("arrivedState/directions maintain initial defaults when null target is passed", () => {
    const { result } = renderHook(() => useScroll(null));
    expect(result.current.arrivedState$.top.get()).toBe(true);
    expect(result.current.arrivedState$.left.get()).toBe(true);
    expect(result.current.arrivedState$.right.get()).toBe(false);
    expect(result.current.arrivedState$.bottom.get()).toBe(false);
    expect(result.current.directions$.left.get()).toBe(false);
    expect(result.current.directions$.right.get()).toBe(false);
    expect(result.current.directions$.top.get()).toBe(false);
    expect(result.current.directions$.bottom.get()).toBe(false);
  });

  it("does not register scroll event listener when null target is passed", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useScroll(null));
    const scrollCalls = addSpy.mock.calls.filter(([type]) => type === "scroll");
    expect(scrollCalls).toHaveLength(0);
  });

  it("throttle and idle timer interaction — rapid scroll bursts only fire once per throttle window", () => {
    vi.useRealTimers(); // real timers needed for throttle Date.now()

    const el = makeEl({ scrollTop: 0 });
    const { result } = renderHook(() => useScroll(wrapEl(el), { throttle: 100 }));

    // Fire the first scroll — should be processed immediately
    act(() => {
      (el as any).scrollTop = 50;
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.y$.get()).toBe(50);

    // Fire two more scrolls within the 100ms throttle window
    act(() => {
      (el as any).scrollTop = 70;
      el.dispatchEvent(new Event("scroll"));
    });
    act(() => {
      (el as any).scrollTop = 90;
      el.dispatchEvent(new Event("scroll"));
    });

    // Both should be throttled — y remains at 50
    expect(result.current.y$.get()).toBe(50);
  });

  it("scroll listener is removed when element is removed during idle wait", () => {
    const target$ = observable<OpaqueObject<HTMLDivElement> | null>(null);
    const el = makeEl();

    const { result } = renderHook(() => useScroll(target$ as any, { idle: 200 }));

    // Assign element and scroll
    act(() => target$.set(ObservableHint.opaque(el)));
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.isScrolling$.get()).toBe(true);

    // Remove element — listener is detached
    const removeSpy = vi.spyOn(el, "removeEventListener");
    act(() => target$.set(null));
    expect(removeSpy.mock.calls.some(([type]) => type === "scroll")).toBe(true);

    // Subsequent scroll events on the old element should not update state
    act(() => {
      (el as any).scrollTop = 999;
      el.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.y$.get()).not.toBe(999);

    // isScrolling$ becomes false once the idle timer fires
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isScrolling$.get()).toBe(false);
  });

  it("non-scrollable element (scrollHeight === clientHeight) reports both top and bottom arrived", () => {
    // maxY = 400 - 400 = 0 → both top (0 <= 0) and bottom (0 >= 0) are true
    const el = makeEl({ scrollTop: 0, scrollHeight: 400, clientHeight: 400 });
    const { result } = renderHook(() => useScroll(wrapEl(el)));

    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.arrivedState$.top.get()).toBe(true);
    expect(result.current.arrivedState$.bottom.get()).toBe(true);
  });
});
