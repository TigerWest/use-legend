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

const fireBatteryEvent = (event: string) => {
  eventListeners[event]?.forEach((handler) => handler());
};

describe("useBattery()", () => {
  describe("return shape", () => {
    it("returns all observable fields", () => {
      const { result } = renderHook(() => useBattery());
      const r = result.current;
      expect(typeof r.isSupported$.get).toBe("function");
      expect(typeof r.charging$.get).toBe("function");
      expect(typeof r.chargingTime$.get).toBe("function");
      expect(typeof r.dischargingTime$.get).toBe("function");
      expect(typeof r.level$.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when getBattery exists", () => {
      const { result } = renderHook(() => useBattery());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("charging$ is false initially (before getBattery resolves)", () => {
      Object.defineProperty(navigator, "getBattery", {
        value: vi.fn(() => new Promise(() => {})),
        writable: true,
        configurable: true,
      });
      const { result } = renderHook(() => useBattery());
      expect(result.current.charging$.get()).toBe(false);
    });

    it("level$ is 1 initially (before getBattery resolves)", () => {
      Object.defineProperty(navigator, "getBattery", {
        value: vi.fn(() => new Promise(() => {})),
        writable: true,
        configurable: true,
      });
      const { result } = renderHook(() => useBattery());
      expect(result.current.level$.get()).toBe(1);
    });
  });

  describe("after getBattery resolves", () => {
    it("charging$ reflects battery value", async () => {
      const { result } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });
      expect(result.current.charging$.get()).toBe(true);
    });

    it("chargingTime$ reflects battery value", async () => {
      const { result } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });
      expect(result.current.chargingTime$.get()).toBe(100);
    });

    it("dischargingTime$ reflects battery value", async () => {
      const { result } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });
      expect(result.current.dischargingTime$.get()).toBe(Infinity);
    });

    it("level$ reflects battery value", async () => {
      const { result } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });
      expect(result.current.level$.get()).toBe(0.75);
    });
  });

  describe("battery events", () => {
    it("updates charging$ on chargingchange event", async () => {
      const { result } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });

      expect(result.current.charging$.get()).toBe(true);

      batteryManager.charging = false;
      act(() => {
        fireBatteryEvent("chargingchange");
      });

      expect(result.current.charging$.get()).toBe(false);
    });

    it("updates chargingTime$ on chargingtimechange event", async () => {
      const { result } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });

      expect(result.current.chargingTime$.get()).toBe(100);

      batteryManager.chargingTime = 200;
      act(() => {
        fireBatteryEvent("chargingtimechange");
      });

      expect(result.current.chargingTime$.get()).toBe(200);
    });

    it("updates dischargingTime$ on dischargingtimechange event", async () => {
      batteryManager.dischargingTime = 3600;
      const { result } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });

      expect(result.current.dischargingTime$.get()).toBe(3600);

      batteryManager.dischargingTime = 1800;
      act(() => {
        fireBatteryEvent("dischargingtimechange");
      });

      expect(result.current.dischargingTime$.get()).toBe(1800);
    });

    it("updates level$ on levelchange event", async () => {
      const { result } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });

      expect(result.current.level$.get()).toBe(0.75);

      batteryManager.level = 0.5;
      act(() => {
        fireBatteryEvent("levelchange");
      });

      expect(result.current.level$.get()).toBe(0.5);
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listeners on unmount", async () => {
      const { unmount } = renderHook(() => useBattery());
      await act(async () => {
        await flush();
      });

      unmount();
      await flush();

      expect(batteryManager.removeEventListener).toHaveBeenCalledWith(
        "chargingchange",
        expect.any(Function)
      );
      expect(batteryManager.removeEventListener).toHaveBeenCalledWith(
        "chargingtimechange",
        expect.any(Function)
      );
      expect(batteryManager.removeEventListener).toHaveBeenCalledWith(
        "dischargingtimechange",
        expect.any(Function)
      );
      expect(batteryManager.removeEventListener).toHaveBeenCalledWith(
        "levelchange",
        expect.any(Function)
      );
    });
  });

  describe("unsupported environment", () => {
    it("isSupported$ is false when getBattery is not available", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test setup
      delete (navigator as any).getBattery;
      const { result } = renderHook(() => useBattery());
      expect(result.current.isSupported$.get()).toBe(false);
    });
  });
});
