// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDeviceMotion } from ".";

function dispatchDeviceMotion(overrides: {
  acceleration?: Partial<{ x: number | null; y: number | null; z: number | null }>;
  interval?: number;
}) {
  const event = new Event("devicemotion") as DeviceMotionEvent;
  const acc = { x: null, y: null, z: null, ...overrides.acceleration };
  Object.defineProperty(event, "acceleration", { value: acc, configurable: true });
  Object.defineProperty(event, "accelerationIncludingGravity", {
    value: { x: null, y: null, z: null },
    configurable: true,
  });
  Object.defineProperty(event, "rotationRate", {
    value: { alpha: null, beta: null, gamma: null },
    configurable: true,
  });
  Object.defineProperty(event, "interval", {
    value: overrides.interval ?? 16,
    configurable: true,
  });
  window.dispatchEvent(event);
}

describe("useDeviceMotion() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resource stability", () => {
    it("does not re-register devicemotion listener on re-render", () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(() => useDeviceMotion());

      const countAfterMount = addSpy.mock.calls.filter(([type]) => type === "devicemotion").length;

      rerender();
      rerender();
      rerender();

      const countAfterRerender = addSpy.mock.calls.filter(
        ([type]) => type === "devicemotion"
      ).length;

      expect(countAfterRerender).toBe(countAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("returns stable observable references across re-renders", () => {
      const { result, rerender } = renderHook(() => useDeviceMotion());

      const before = result.current;
      rerender();
      const after = result.current;

      expect(before.isSupported$).toBe(after.isSupported$);
      expect(before.acceleration$).toBe(after.acceleration$);
      expect(before.accelerationIncludingGravity$).toBe(after.accelerationIncludingGravity$);
      expect(before.rotationRate$).toBe(after.rotationRate$);
      expect(before.interval$).toBe(after.interval$);
    });

    it("values are preserved after re-render", () => {
      const { result, rerender } = renderHook(() => useDeviceMotion());

      act(() => {
        dispatchDeviceMotion({ acceleration: { x: 3, y: 4, z: 5 }, interval: 32 });
      });

      expect(result.current.acceleration$.get().x).toBe(3);
      expect(result.current.interval$.get()).toBe(32);

      rerender();

      expect(result.current.acceleration$.get().x).toBe(3);
      expect(result.current.interval$.get()).toBe(32);
    });
  });

  describe("callback freshness", () => {
    it("devicemotion events still update values after re-render", () => {
      const { result, rerender } = renderHook(() => useDeviceMotion());

      rerender();
      rerender();

      act(() => {
        dispatchDeviceMotion({ acceleration: { x: 7, y: 8, z: 9 } });
      });

      expect(result.current.acceleration$.get().x).toBe(7);
      expect(result.current.acceleration$.get().y).toBe(8);
      expect(result.current.acceleration$.get().z).toBe(9);
    });
  });
});
