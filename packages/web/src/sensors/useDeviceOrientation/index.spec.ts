// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDeviceOrientation } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

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

describe("useDeviceOrientation()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns all observable fields", () => {
      const { result } = renderHook(() => useDeviceOrientation());
      const r = result.current;
      expect(typeof r.isSupported$.get).toBe("function");
      expect(typeof r.isAbsolute$.get).toBe("function");
      expect(typeof r.alpha$.get).toBe("function");
      expect(typeof r.beta$.get).toBe("function");
      expect(typeof r.gamma$.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("alpha$ starts as null", () => {
      const { result } = renderHook(() => useDeviceOrientation());
      expect(result.current.alpha$.get()).toBeNull();
    });

    it("beta$ starts as null", () => {
      const { result } = renderHook(() => useDeviceOrientation());
      expect(result.current.beta$.get()).toBeNull();
    });

    it("gamma$ starts as null", () => {
      const { result } = renderHook(() => useDeviceOrientation());
      expect(result.current.gamma$.get()).toBeNull();
    });

    it("isAbsolute$ starts as false", () => {
      const { result } = renderHook(() => useDeviceOrientation());
      expect(result.current.isAbsolute$.get()).toBe(false);
    });

    it("isSupported$ is true when DeviceOrientationEvent is available", () => {
      const original = (globalThis as Record<string, unknown>).DeviceOrientationEvent;
      (globalThis as Record<string, unknown>).DeviceOrientationEvent = class {};

      const { result } = renderHook(() => useDeviceOrientation());
      expect(result.current.isSupported$.get()).toBe(true);

      if (original === undefined) {
        delete (globalThis as Record<string, unknown>).DeviceOrientationEvent;
      } else {
        (globalThis as Record<string, unknown>).DeviceOrientationEvent = original;
      }
    });
  });

  describe("event handling", () => {
    it("updates alpha$ on deviceorientation event", () => {
      const { result } = renderHook(() => useDeviceOrientation());

      act(() => {
        dispatchDeviceOrientation({ alpha: 123.45 });
      });

      expect(result.current.alpha$.get()).toBe(123.45);
    });

    it("updates beta$ on deviceorientation event", () => {
      const { result } = renderHook(() => useDeviceOrientation());

      act(() => {
        dispatchDeviceOrientation({ beta: -45.6 });
      });

      expect(result.current.beta$.get()).toBe(-45.6);
    });

    it("updates gamma$ on deviceorientation event", () => {
      const { result } = renderHook(() => useDeviceOrientation());

      act(() => {
        dispatchDeviceOrientation({ gamma: 30.0 });
      });

      expect(result.current.gamma$.get()).toBe(30.0);
    });

    it("updates isAbsolute$ on deviceorientation event", () => {
      const { result } = renderHook(() => useDeviceOrientation());

      act(() => {
        dispatchDeviceOrientation({ absolute: true });
      });

      expect(result.current.isAbsolute$.get()).toBe(true);
    });

    it("updates all fields at once on deviceorientation event", () => {
      const { result } = renderHook(() => useDeviceOrientation());

      act(() => {
        dispatchDeviceOrientation({ absolute: true, alpha: 90, beta: 45, gamma: -30 });
      });

      expect(result.current.isAbsolute$.get()).toBe(true);
      expect(result.current.alpha$.get()).toBe(90);
      expect(result.current.beta$.get()).toBe(45);
      expect(result.current.gamma$.get()).toBe(-30);
    });

    it("handles null orientation fields gracefully", () => {
      const { result } = renderHook(() => useDeviceOrientation());

      act(() => {
        dispatchDeviceOrientation({ alpha: null, beta: null, gamma: null });
      });

      expect(result.current.alpha$.get()).toBeNull();
      expect(result.current.beta$.get()).toBeNull();
      expect(result.current.gamma$.get()).toBeNull();
    });
  });

  describe("unmount cleanup", () => {
    it("removes deviceorientation event listener on unmount", async () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useDeviceOrientation());
      unmount();
      await flush();

      const added = addSpy.mock.calls.some(([type]) => type === "deviceorientation");
      const removed = removeSpy.mock.calls.some(([type]) => type === "deviceorientation");
      expect(added).toBe(true);
      expect(removed).toBe(true);
    });

    it("does not update values after unmount", async () => {
      const { result, unmount } = renderHook(() => useDeviceOrientation());

      unmount();
      await flush();

      act(() => {
        dispatchDeviceOrientation({ alpha: 99, beta: 99, gamma: 99 });
      });

      // Values should remain at initial null state
      expect(result.current.alpha$.get()).toBeNull();
    });
  });

  describe("SSR guard", () => {
    it("isSupported$ is false when DeviceOrientationEvent is not defined", () => {
      const had = "DeviceOrientationEvent" in globalThis;
      const original = (globalThis as Record<string, unknown>).DeviceOrientationEvent;
      if (had) delete (globalThis as Record<string, unknown>).DeviceOrientationEvent;

      const { result } = renderHook(() => useDeviceOrientation());
      expect(result.current.isSupported$.get()).toBe(false);

      if (had) (globalThis as Record<string, unknown>).DeviceOrientationEvent = original;
    });
  });
});
