// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWindowScroll } from ".";
import * as useScrollModule from "../useScroll";

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

  it("calls useScroll internally with window as target", () => {
    const spy = vi.spyOn(useScrollModule, "useScroll");
    renderHook(() => useWindowScroll());
    expect(spy).toHaveBeenCalledWith(window, undefined);
  });

  it("options are forwarded to useScroll as-is", () => {
    const spy = vi.spyOn(useScrollModule, "useScroll");
    const options = { idle: 500, throttle: 100 };
    renderHook(() => useWindowScroll(options));
    expect(spy).toHaveBeenCalledWith(window, options);
  });

  it("returns an object matching UseScrollReturn shape", () => {
    const { result } = renderHook(() => useWindowScroll());
    expect(typeof result.current.x.get).toBe("function");
    expect(typeof result.current.y.get).toBe("function");
    expect(typeof result.current.isScrolling.get).toBe("function");
    expect(typeof result.current.arrivedState.get).toBe("function");
    expect(typeof result.current.directions.get).toBe("function");
    expect(typeof result.current.measure).toBe("function");
  });
});
