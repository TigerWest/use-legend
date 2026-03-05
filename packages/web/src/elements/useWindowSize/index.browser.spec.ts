/**
 * useWindowSize - Browser Mode Spec
 *
 * Unlike the jsdom spec (index.spec.ts), this runs in real Chromium.
 * - Uses matchMedia, visualViewport, innerWidth/Height without mocks
 * - Verifies integration with real browser APIs
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useWindowSize } from ".";

describe("useWindowSize() — real browser", () => {
  it("runs in an actual browser environment (not jsdom)", () => {
    // jsdom includes 'jsdom' in its userAgent
    expect(navigator.userAgent).not.toContain("jsdom");
  });

  it("reads real window.innerWidth and window.innerHeight", () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width.get()).toBe(window.innerWidth);
    expect(result.current.height.get()).toBe(window.innerHeight);
  });

  it("type: 'outer' reads real outerWidth/outerHeight", () => {
    const { result } = renderHook(() => useWindowSize({ type: "outer" }));
    expect(result.current.width.get()).toBe(window.outerWidth);
    expect(result.current.height.get()).toBe(window.outerHeight);
  });

  it("type: 'visual' reads visualViewport when available", () => {
    const { result } = renderHook(() => useWindowSize({ type: "visual" }));
    if (window.visualViewport) {
      expect(result.current.width.get()).toBeCloseTo(
        window.visualViewport.width * window.visualViewport.scale,
        0
      );
    } else {
      expect(result.current.width.get()).toBe(window.innerWidth);
    }
  });

  it("updates size on window resize event", async () => {
    const { result } = renderHook(() => useWindowSize());
    const initialWidth = result.current.width.get();

    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });

    // After resize, values should still match actual window dimensions
    expect(result.current.width.get()).toBe(window.innerWidth);
    expect(typeof initialWidth).toBe("number");
  });

  it("matchMedia is available and functional in real browser", () => {
    expect(typeof window.matchMedia).toBe("function");
    const mq = window.matchMedia("(min-width: 0px)");
    expect(mq.matches).toBe(true);
  });
});
