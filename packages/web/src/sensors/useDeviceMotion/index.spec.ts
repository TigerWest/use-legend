// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDeviceMotion } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function dispatchDeviceMotion(overrides: {
  acceleration?: Partial<{ x: number | null; y: number | null; z: number | null }>;
  accelerationIncludingGravity?: Partial<{
    x: number | null;
    y: number | null;
    z: number | null;
  }>;
  rotationRate?: Partial<{ alpha: number | null; beta: number | null; gamma: number | null }>;
  interval?: number;
}) {
  // Create a plain event and define properties manually since jsdom doesn't support
  // DeviceMotionEvent constructor params
  const event = new Event("devicemotion") as DeviceMotionEvent;

  const acc = { x: null, y: null, z: null, ...overrides.acceleration };
  const accGrav = { x: null, y: null, z: null, ...overrides.accelerationIncludingGravity };
  const rot = { alpha: null, beta: null, gamma: null, ...overrides.rotationRate };
  const interval = overrides.interval ?? 16;

  Object.defineProperty(event, "acceleration", { value: acc, configurable: true });
  Object.defineProperty(event, "accelerationIncludingGravity", {
    value: accGrav,
    configurable: true,
  });
  Object.defineProperty(event, "rotationRate", { value: rot, configurable: true });
  Object.defineProperty(event, "interval", { value: interval, configurable: true });

  window.dispatchEvent(event);
}

describe("useDeviceMotion()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns all observable fields", () => {
      const { result } = renderHook(() => useDeviceMotion());
      const r = result.current;
      expect(typeof r.isSupported$.get).toBe("function");
      expect(typeof r.acceleration$.get).toBe("function");
      expect(typeof r.accelerationIncludingGravity$.get).toBe("function");
      expect(typeof r.rotationRate$.get).toBe("function");
      expect(typeof r.interval$.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("acceleration$ starts with all null components", () => {
      const { result } = renderHook(() => useDeviceMotion());
      const acc = result.current.acceleration$.get();
      expect(acc.x).toBeNull();
      expect(acc.y).toBeNull();
      expect(acc.z).toBeNull();
    });

    it("accelerationIncludingGravity$ starts with all null components", () => {
      const { result } = renderHook(() => useDeviceMotion());
      const accGrav = result.current.accelerationIncludingGravity$.get();
      expect(accGrav.x).toBeNull();
      expect(accGrav.y).toBeNull();
      expect(accGrav.z).toBeNull();
    });

    it("rotationRate$ starts with all null components", () => {
      const { result } = renderHook(() => useDeviceMotion());
      const rot = result.current.rotationRate$.get();
      expect(rot.alpha).toBeNull();
      expect(rot.beta).toBeNull();
      expect(rot.gamma).toBeNull();
    });

    it("interval$ starts at 0", () => {
      const { result } = renderHook(() => useDeviceMotion());
      expect(result.current.interval$.get()).toBe(0);
    });

    it("isSupported$ is true when DeviceMotionEvent is available", () => {
      // jsdom does not define DeviceMotionEvent — mock it
      const original = (globalThis as Record<string, unknown>).DeviceMotionEvent;
      (globalThis as Record<string, unknown>).DeviceMotionEvent = class {};

      const { result } = renderHook(() => useDeviceMotion());
      expect(result.current.isSupported$.get()).toBe(true);

      if (original === undefined) {
        delete (globalThis as Record<string, unknown>).DeviceMotionEvent;
      } else {
        (globalThis as Record<string, unknown>).DeviceMotionEvent = original;
      }
    });
  });

  describe("event handling", () => {
    it("updates acceleration$ on devicemotion event", () => {
      const { result } = renderHook(() => useDeviceMotion());

      act(() => {
        dispatchDeviceMotion({ acceleration: { x: 1.5, y: -2.3, z: 0.8 } });
      });

      const acc = result.current.acceleration$.get();
      expect(acc.x).toBe(1.5);
      expect(acc.y).toBe(-2.3);
      expect(acc.z).toBe(0.8);
    });

    it("updates accelerationIncludingGravity$ on devicemotion event", () => {
      const { result } = renderHook(() => useDeviceMotion());

      act(() => {
        dispatchDeviceMotion({
          accelerationIncludingGravity: { x: 0.1, y: 0.2, z: 9.8 },
        });
      });

      const accGrav = result.current.accelerationIncludingGravity$.get();
      expect(accGrav.x).toBe(0.1);
      expect(accGrav.y).toBe(0.2);
      expect(accGrav.z).toBe(9.8);
    });

    it("updates rotationRate$ on devicemotion event", () => {
      const { result } = renderHook(() => useDeviceMotion());

      act(() => {
        dispatchDeviceMotion({ rotationRate: { alpha: 10, beta: 20, gamma: -5 } });
      });

      const rot = result.current.rotationRate$.get();
      expect(rot.alpha).toBe(10);
      expect(rot.beta).toBe(20);
      expect(rot.gamma).toBe(-5);
    });

    it("updates interval$ on devicemotion event", () => {
      const { result } = renderHook(() => useDeviceMotion());

      act(() => {
        dispatchDeviceMotion({ interval: 50 });
      });

      expect(result.current.interval$.get()).toBe(50);
    });

    it("handles null acceleration fields gracefully", () => {
      const { result } = renderHook(() => useDeviceMotion());

      act(() => {
        dispatchDeviceMotion({ acceleration: { x: null, y: null, z: null } });
      });

      const acc = result.current.acceleration$.get();
      expect(acc.x).toBeNull();
      expect(acc.y).toBeNull();
      expect(acc.z).toBeNull();
    });
  });

  describe("unmount cleanup", () => {
    it("removes devicemotion event listener on unmount", async () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useDeviceMotion());
      unmount();
      await flush();

      const added = addSpy.mock.calls.some(([type]) => type === "devicemotion");
      const removed = removeSpy.mock.calls.some(([type]) => type === "devicemotion");
      expect(added).toBe(true);
      expect(removed).toBe(true);
    });

    it("does not update values after unmount", async () => {
      const { result, unmount } = renderHook(() => useDeviceMotion());

      unmount();
      await flush();

      act(() => {
        dispatchDeviceMotion({ acceleration: { x: 99, y: 99, z: 99 } });
      });

      // Values should remain at initial null state
      const acc = result.current.acceleration$.get();
      expect(acc.x).toBeNull();
    });
  });

  describe("SSR guard", () => {
    it("isSupported$ is false when DeviceMotionEvent is not defined", () => {
      // Ensure DeviceMotionEvent is not present (jsdom does not define it by default)
      const had = "DeviceMotionEvent" in globalThis;
      const original = (globalThis as Record<string, unknown>).DeviceMotionEvent;
      if (had) delete (globalThis as Record<string, unknown>).DeviceMotionEvent;

      const { result } = renderHook(() => useDeviceMotion());
      expect(result.current.isSupported$.get()).toBe(false);

      if (had) (globalThis as Record<string, unknown>).DeviceMotionEvent = original;
    });
  });
});
