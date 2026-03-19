// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useGeolocation } from ".";

function mockGeolocation() {
  const geo = {
    watchPosition: vi.fn(() => 1),
    clearWatch: vi.fn(),
    getCurrentPosition: vi.fn(),
  };
  Object.defineProperty(navigator, "geolocation", {
    value: geo,
    configurable: true,
    writable: true,
  });
  return geo;
}

describe("useGeolocation() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).geolocation;
  });

  it("observable references are stable across re-renders", () => {
    mockGeolocation();
    const { result, rerender } = renderHook(() => useGeolocation());
    const first = result.current;
    rerender();
    expect(result.current.isSupported$).toBe(first.isSupported$);
    expect(result.current.coords$).toBe(first.coords$);
    expect(result.current.locatedAt$).toBe(first.locatedAt$);
    expect(result.current.error$).toBe(first.error$);
  });

  it("pause/resume function references are stable", () => {
    mockGeolocation();
    const { result, rerender } = renderHook(() => useGeolocation());
    const firstPause = result.current.pause;
    const firstResume = result.current.resume;
    rerender();
    expect(result.current.pause).toBe(firstPause);
    expect(result.current.resume).toBe(firstResume);
  });

  it("does not re-register watchPosition on re-render", () => {
    const geo = mockGeolocation();
    const { rerender } = renderHook(() => useGeolocation());
    const callsAfterMount = geo.watchPosition.mock.calls.length;
    rerender();
    rerender();
    expect(geo.watchPosition.mock.calls.length).toBe(callsAfterMount);
  });
});
