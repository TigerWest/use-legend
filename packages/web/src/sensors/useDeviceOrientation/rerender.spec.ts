// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDeviceOrientation } from ".";

function dispatchDeviceOrientation(overrides: {
  absolute?: boolean;
  alpha?: number | null;
  beta?: number | null;
  gamma?: number | null;
}) {
  const event = new Event("deviceorientation") as DeviceOrientationEvent;
  Object.defineProperty(event, "absolute", {
    value: overrides.absolute ?? false,
    configurable: true,
  });
  Object.defineProperty(event, "alpha", {
    value: overrides.alpha ?? null,
    configurable: true,
  });
  Object.defineProperty(event, "beta", {
    value: overrides.beta ?? null,
    configurable: true,
  });
  Object.defineProperty(event, "gamma", {
    value: overrides.gamma ?? null,
    configurable: true,
  });
  window.dispatchEvent(event);
}

describe("useDeviceOrientation() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register deviceorientation listener on re-render", () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(() => useDeviceOrientation());

      const countAfterMount = addSpy.mock.calls.filter(
        ([type]) => type === "deviceorientation"
      ).length;

      rerender();
      rerender();
      rerender();

      const countAfterRerender = addSpy.mock.calls.filter(
        ([type]) => type === "deviceorientation"
      ).length;

      expect(countAfterRerender).toBe(countAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("returns stable observable references across re-renders", () => {
      const { result, rerender } = renderHook(() => useDeviceOrientation());

      const before = result.current;
      rerender();
      const after = result.current;

      expect(before.isSupported$).toBe(after.isSupported$);
      expect(before.isAbsolute$).toBe(after.isAbsolute$);
      expect(before.alpha$).toBe(after.alpha$);
      expect(before.beta$).toBe(after.beta$);
      expect(before.gamma$).toBe(after.gamma$);
    });

    it("values are preserved after re-render", () => {
      const { result, rerender } = renderHook(() => useDeviceOrientation());

      act(() => {
        dispatchDeviceOrientation({ alpha: 180, beta: 45, gamma: -30 });
      });

      expect(result.current.alpha$.get()).toBe(180);
      expect(result.current.beta$.get()).toBe(45);
      expect(result.current.gamma$.get()).toBe(-30);

      rerender();

      expect(result.current.alpha$.get()).toBe(180);
      expect(result.current.beta$.get()).toBe(45);
      expect(result.current.gamma$.get()).toBe(-30);
    });
  });

  describe("callback freshness", () => {
    it("deviceorientation events still update values after re-render", () => {
      const { result, rerender } = renderHook(() => useDeviceOrientation());

      rerender();
      rerender();

      act(() => {
        dispatchDeviceOrientation({ alpha: 270, beta: -90, gamma: 60 });
      });

      expect(result.current.alpha$.get()).toBe(270);
      expect(result.current.beta$.get()).toBe(-90);
      expect(result.current.gamma$.get()).toBe(60);
    });
  });
});
