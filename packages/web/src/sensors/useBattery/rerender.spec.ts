// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useBattery } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

let batteryManager: any;
let eventListeners: Record<string, Set<() => void>>;

beforeEach(() => {
  eventListeners = {};

  batteryManager = {
    charging: true,
    chargingTime: 100,
    dischargingTime: Infinity,
    level: 0.75,
    addEventListener: vi.fn((event: string, handler: () => void) => {
      if (!eventListeners[event]) eventListeners[event] = new Set();
      eventListeners[event].add(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: () => void) => {
      eventListeners[event]?.delete(handler);
    }),
  };

  Object.defineProperty(navigator, "getBattery", {
    value: vi.fn(() => Promise.resolve(batteryManager)),
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useBattery() — rerender stability", () => {
  describe("observable references are stable across re-renders", () => {
    it("isSupported$ identity is stable", () => {
      const { result, rerender } = renderHook(() => useBattery());
      const before = result.current.isSupported$;
      rerender();
      expect(result.current.isSupported$).toBe(before);
    });

    it("charging$ identity is stable", () => {
      const { result, rerender } = renderHook(() => useBattery());
      const before = result.current.charging$;
      rerender();
      expect(result.current.charging$).toBe(before);
    });

    it("chargingTime$ identity is stable", () => {
      const { result, rerender } = renderHook(() => useBattery());
      const before = result.current.chargingTime$;
      rerender();
      expect(result.current.chargingTime$).toBe(before);
    });

    it("dischargingTime$ identity is stable", () => {
      const { result, rerender } = renderHook(() => useBattery());
      const before = result.current.dischargingTime$;
      rerender();
      expect(result.current.dischargingTime$).toBe(before);
    });

    it("level$ identity is stable", () => {
      const { result, rerender } = renderHook(() => useBattery());
      const before = result.current.level$;
      rerender();
      expect(result.current.level$).toBe(before);
    });
  });

  describe("values persist across re-renders", () => {
    it("charging$ retains value after re-render", async () => {
      const { result, rerender } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });

      expect(result.current.charging$.get()).toBe(true);

      rerender();

      expect(result.current.charging$.get()).toBe(true);
    });

    it("chargingTime$ retains value after re-render", async () => {
      const { result, rerender } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });

      expect(result.current.chargingTime$.get()).toBe(100);

      rerender();

      expect(result.current.chargingTime$.get()).toBe(100);
    });

    it("level$ retains value after re-render", async () => {
      const { result, rerender } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });

      expect(result.current.level$.get()).toBe(0.75);

      rerender();

      expect(result.current.level$.get()).toBe(0.75);
    });
  });
});
