// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useDevicePixelRatio } from ".";

function createMockMatchMedia() {
  let handler: (() => void) | null = null;
  const mql = {
    matches: true,
    media: "",
    addEventListener: vi.fn((_event: string, h: () => void) => {
      handler = h;
    }),
    removeEventListener: vi.fn(() => {
      handler = null;
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
    triggerChange: () => {
      handler?.();
    },
  };
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn(() => mql),
    configurable: true,
    writable: true,
  });
  return { mql };
}

describe("useDevicePixelRatio() — rerender stability", () => {
  let originalDpr: number;

  beforeEach(() => {
    originalDpr = window.devicePixelRatio;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "devicePixelRatio", {
      value: originalDpr,
      configurable: true,
      writable: true,
    });
  });

  it("observable references are stable across re-renders", () => {
    createMockMatchMedia();
    const { result, rerender } = renderHook(() => useDevicePixelRatio());
    const first = result.current;
    rerender();
    expect(result.current.isSupported$).toBe(first.isSupported$);
    expect(result.current.pixelRatio$).toBe(first.pixelRatio$);
  });

  it("pixelRatio$ value persists across re-renders", () => {
    createMockMatchMedia();
    Object.defineProperty(window, "devicePixelRatio", {
      value: 2,
      configurable: true,
      writable: true,
    });
    const { result, rerender } = renderHook(() => useDevicePixelRatio());
    expect(result.current.pixelRatio$.get()).toBe(2);
    rerender();
    expect(result.current.pixelRatio$.get()).toBe(2);
  });

  it("DPR changes still update after re-render", () => {
    const { mql } = createMockMatchMedia();
    Object.defineProperty(window, "devicePixelRatio", {
      value: 1,
      configurable: true,
      writable: true,
    });
    const { result, rerender } = renderHook(() => useDevicePixelRatio());
    rerender();

    act(() => {
      Object.defineProperty(window, "devicePixelRatio", {
        value: 3,
        configurable: true,
        writable: true,
      });
      mql.triggerChange();
    });

    expect(result.current.pixelRatio$.get()).toBe(3);
  });

  it("does not re-register matchMedia listener on re-render", () => {
    createMockMatchMedia();
    const matchMediaSpy = window.matchMedia as ReturnType<typeof vi.fn>;
    const { rerender } = renderHook(() => useDevicePixelRatio());
    const callsAfterMount = matchMediaSpy.mock.calls.length;
    rerender();
    rerender();
    expect(matchMediaSpy.mock.calls.length).toBe(callsAfterMount);
  });
});
