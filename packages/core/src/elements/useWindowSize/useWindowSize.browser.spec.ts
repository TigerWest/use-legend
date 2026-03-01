/**
 * useWindowSize - Browser Mode Spec
 *
 * jsdom spec (index.spec.ts)과 달리 실제 Chromium에서 실행됩니다.
 * - matchMedia, visualViewport, innerWidth/Height 등을 mock 없이 사용
 * - 실제 브라우저 API와의 통합을 검증
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useWindowSize } from ".";

describe("useWindowSize() — real browser", () => {
  it("runs in an actual browser environment (not jsdom)", () => {
    // jsdom의 경우 userAgent에 'jsdom'이 포함됨
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
        0,
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

    // resize 후에도 실제 window 값과 일치해야 함
    expect(result.current.width.get()).toBe(window.innerWidth);
    expect(typeof initialWidth).toBe("number");
  });

  it("matchMedia is available and functional in real browser", () => {
    expect(typeof window.matchMedia).toBe("function");
    const mq = window.matchMedia("(min-width: 0px)");
    expect(mq.matches).toBe(true);
  });
});
