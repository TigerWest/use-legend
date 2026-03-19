// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useGeolocation } from ".";

const mockWatchPosition = vi.fn().mockReturnValue(42);
const mockClearWatch = vi.fn();

beforeEach(() => {
  mockWatchPosition.mockClear();
  mockClearWatch.mockClear();
  mockWatchPosition.mockReturnValue(42);

  Object.defineProperty(navigator, "geolocation", {
    value: {
      watchPosition: mockWatchPosition,
      clearWatch: mockClearWatch,
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useGeolocation() — reactive options", () => {
  describe("Observable option change", () => {
    it("enableHighAccuracy$ observable — changing before resume() uses new value", () => {
      const enableHighAccuracy$ = observable(false);
      const { result } = renderHook(() =>
        useGeolocation({ enableHighAccuracy: enableHighAccuracy$, immediate: false })
      );

      act(() => {
        result.current.resume();
      });
      expect(mockWatchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({ enableHighAccuracy: false })
      );

      act(() => {
        result.current.pause();
      });
      act(() => {
        enableHighAccuracy$.set(true);
      });
      act(() => {
        result.current.resume();
      });

      expect(mockWatchPosition).toHaveBeenLastCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({ enableHighAccuracy: true })
      );
    });

    it("timeout$ observable — changing before resume() uses new timeout", () => {
      const timeout$ = observable(5000);
      const { result } = renderHook(() => useGeolocation({ timeout: timeout$, immediate: false }));

      act(() => {
        result.current.resume();
      });
      expect(mockWatchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({ timeout: 5000 })
      );

      act(() => {
        result.current.pause();
      });
      act(() => {
        timeout$.set(10000);
      });
      act(() => {
        result.current.resume();
      });

      expect(mockWatchPosition).toHaveBeenLastCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it("maximumAge$ observable — changing before resume() uses new value", () => {
      const maximumAge$ = observable(0);
      const { result } = renderHook(() =>
        useGeolocation({ maximumAge: maximumAge$, immediate: false })
      );

      act(() => {
        result.current.resume();
      });
      expect(mockWatchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({ maximumAge: 0 })
      );

      act(() => {
        result.current.pause();
      });
      act(() => {
        maximumAge$.set(60000);
      });
      act(() => {
        result.current.resume();
      });

      expect(mockWatchPosition).toHaveBeenLastCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({ maximumAge: 60000 })
      );
    });

    it("passing full options as observable works", () => {
      const opts$ = observable({
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 3000,
        immediate: false,
      });
      const { result } = renderHook(() => useGeolocation(opts$));

      act(() => {
        result.current.resume();
      });

      expect(mockWatchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 3000,
        })
      );
    });

    it("isActive$ becomes true after resume(), false after pause()", () => {
      const { result } = renderHook(() => useGeolocation({ immediate: false }));

      expect(result.current.isActive$.get()).toBe(false);

      act(() => {
        result.current.resume();
      });
      expect(result.current.isActive$.get()).toBe(true);

      act(() => {
        result.current.pause();
      });
      expect(result.current.isActive$.get()).toBe(false);
    });
  });
});
