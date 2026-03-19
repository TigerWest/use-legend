// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useGeolocation } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

type SuccessCallback = (position: GeolocationPosition) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;

function mockGeolocation() {
  let successCb: SuccessCallback | null = null;
  let errorCb: ErrorCallback | null = null;
  const geo = {
    watchPosition: vi.fn((success: SuccessCallback, error: ErrorCallback) => {
      successCb = success;
      errorCb = error;
      return 1;
    }),
    clearWatch: vi.fn(),
    getCurrentPosition: vi.fn(),
    triggerSuccess: (position: Partial<GeolocationPosition>) => {
      const pos = {
        timestamp: Date.now(),
        coords: {
          accuracy: 10,
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          ...position.coords,
        },
        ...position,
      } as GeolocationPosition;
      successCb?.(pos);
    },
    triggerError: (code: number, message: string) => {
      const err = {
        code,
        message,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError;
      errorCb?.(err);
    },
  };

  Object.defineProperty(navigator, "geolocation", {
    value: geo,
    configurable: true,
    writable: true,
  });

  return geo;
}

describe("useGeolocation()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).geolocation;
  });

  describe("return shape", () => {
    it("returns observable fields and controls", () => {
      mockGeolocation();
      const { result } = renderHook(() => useGeolocation());
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.coords$.get).toBe("function");
      expect(typeof result.current.locatedAt$.get).toBe("function");
      expect(typeof result.current.error$.get).toBe("function");
      expect(typeof result.current.resume).toBe("function");
      expect(typeof result.current.pause).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when geolocation exists", () => {
      mockGeolocation();
      const { result } = renderHook(() => useGeolocation());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("coords$ has default values", () => {
      mockGeolocation();
      const { result } = renderHook(() => useGeolocation());
      const coords = result.current.coords$.get();
      expect(coords.latitude).toBe(Infinity);
      expect(coords.longitude).toBe(Infinity);
      expect(coords.accuracy).toBe(0);
    });

    it("locatedAt$ is null initially", () => {
      mockGeolocation();
      const { result } = renderHook(() => useGeolocation());
      expect(result.current.locatedAt$.get()).toBeNull();
    });

    it("error$ is null initially", () => {
      mockGeolocation();
      const { result } = renderHook(() => useGeolocation());
      expect(result.current.error$.get()).toBeNull();
    });
  });

  describe("position watching", () => {
    it("starts watching immediately by default", () => {
      const geo = mockGeolocation();
      renderHook(() => useGeolocation());
      expect(geo.watchPosition).toHaveBeenCalled();
    });

    it("does not start watching when immediate=false", () => {
      const geo = mockGeolocation();
      renderHook(() => useGeolocation({ immediate: false }));
      expect(geo.watchPosition).not.toHaveBeenCalled();
    });

    it("updates coords on position success", () => {
      const geo = mockGeolocation();
      const { result } = renderHook(() => useGeolocation());

      act(() => {
        geo.triggerSuccess({
          timestamp: 1000,
          coords: { latitude: 40.7128, longitude: -74.006, accuracy: 5 } as GeolocationCoordinates,
        });
      });

      expect(result.current.coords$.get().latitude).toBe(40.7128);
      expect(result.current.coords$.get().longitude).toBe(-74.006);
      expect(result.current.locatedAt$.get()).toBe(1000);
      expect(result.current.error$.get()).toBeNull();
    });

    it("updates error on position error", () => {
      const geo = mockGeolocation();
      const { result } = renderHook(() => useGeolocation());

      act(() => {
        geo.triggerError(1, "Permission denied");
      });

      expect(result.current.error$.get()).not.toBeNull();
      expect(result.current.error$.get()?.code).toBe(1);
    });

    it("passes options to watchPosition", () => {
      const geo = mockGeolocation();
      renderHook(() =>
        useGeolocation({
          enableHighAccuracy: false,
          maximumAge: 5000,
          timeout: 10000,
        })
      );

      expect(geo.watchPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
        enableHighAccuracy: false,
        maximumAge: 5000,
        timeout: 10000,
      });
    });
  });

  describe("pause/resume", () => {
    it("pause() clears the watch", () => {
      const geo = mockGeolocation();
      const { result } = renderHook(() => useGeolocation());

      act(() => result.current.pause());

      expect(geo.clearWatch).toHaveBeenCalledWith(1);
    });

    it("resume() starts a new watch", () => {
      const geo = mockGeolocation();
      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      expect(geo.watchPosition).not.toHaveBeenCalled();

      act(() => result.current.resume());

      expect(geo.watchPosition).toHaveBeenCalled();
    });
  });

  describe("unmount cleanup", () => {
    it("clears watch on unmount", async () => {
      const geo = mockGeolocation();
      const { unmount } = renderHook(() => useGeolocation());

      unmount();
      await flush();

      expect(geo.clearWatch).toHaveBeenCalled();
    });
  });
});
