// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWindowScroll } from ".";

describe("useWindowScroll()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "scrollX", {
      writable: true,
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
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

  it("registers a scroll listener on window", () => {
    const spy = vi.spyOn(window, "addEventListener");
    renderHook(() => useWindowScroll());
    const scrollCalls = spy.mock.calls.filter(([type]) => type === "scroll");
    expect(scrollCalls.length).toBeGreaterThan(0);
  });

  it("forwards onScroll option to the underlying scroll tracker", () => {
    const onScroll = vi.fn();
    renderHook(() => useWindowScroll({ onScroll }));
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(onScroll).toHaveBeenCalled();
  });

  it("returns an object matching UseScrollReturn shape", () => {
    const { result } = renderHook(() => useWindowScroll());
    expect(typeof result.current.x$.get).toBe("function");
    expect(typeof result.current.y$.get).toBe("function");
    expect(typeof result.current.isScrolling$.get).toBe("function");
    expect(typeof result.current.arrivedState$.get).toBe("function");
    expect(typeof result.current.directions$.get).toBe("function");
    expect(typeof result.current.measure).toBe("function");
  });
});
