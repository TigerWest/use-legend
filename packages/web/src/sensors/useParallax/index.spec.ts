// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { ObservableHint, observable } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useParallax } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

describe("useParallax()", () => {
  beforeEach(() => {
    // DeviceOrientationEvent not in jsdom
    if (!("DeviceOrientationEvent" in window)) {
      (window as any).DeviceOrientationEvent = class {};
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns roll$, tilt$, source$ observables", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => useParallax(wrapEl(el)));
      expect(typeof result.current.roll$.get).toBe("function");
      expect(typeof result.current.tilt$.get).toBe("function");
      expect(typeof result.current.source$.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("source$ defaults to 'mouse' when no device orientation data", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => useParallax(wrapEl(el)));
      expect(result.current.source$.get()).toBe("mouse");
    });

    it("roll$ is 0 initially", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => useParallax(wrapEl(el)));
      expect(result.current.roll$.get()).toBe(0);
    });

    it("tilt$ is 0 initially", () => {
      const el = document.createElement("div");
      const { result } = renderHook(() => useParallax(wrapEl(el)));
      expect(result.current.tilt$.get()).toBe(0);
    });
  });

  describe("options", () => {
    it("accepts custom adjust functions", () => {
      const el = document.createElement("div");
      expect(() =>
        renderHook(() =>
          useParallax(wrapEl(el), {
            mouseTiltAdjust: (v) => v * 2,
            mouseRollAdjust: (v) => v * 2,
            deviceOrientationTiltAdjust: (v) => v * 2,
            deviceOrientationRollAdjust: (v) => v * 2,
          })
        )
      ).not.toThrow();
    });

    it("accepts null target without error", () => {
      expect(() => renderHook(() => useParallax(null))).not.toThrow();
    });
  });
});
