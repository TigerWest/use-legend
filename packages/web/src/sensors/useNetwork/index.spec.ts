// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useNetwork } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function mockConnection(initial: Record<string, unknown> = {}) {
  const listeners: Record<string, Array<() => void>> = {};
  const connection = {
    downlink: 10,
    downlinkMax: undefined,
    effectiveType: "4g" as const,
    rtt: 50,
    saveData: false,
    type: "wifi" as const,
    ...initial,
    addEventListener: vi.fn((event: string, handler: () => void) => {
      (listeners[event] ??= []).push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: () => void) => {
      listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
    }),
    dispatchChange: () => {
      listeners["change"]?.forEach((h) => h());
    },
  };
  Object.defineProperty(navigator, "connection", {
    value: connection,
    configurable: true,
    writable: true,
  });
  return connection;
}

describe("useNetwork()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test cleanup
    delete (navigator as any).connection;
  });

  describe("return shape", () => {
    it("returns observable fields", () => {
      const { result } = renderHook(() => useNetwork());
      const r = result.current;
      expect(typeof r.isSupported$.get).toBe("function");
      expect(typeof r.isOnline$.get).toBe("function");
      expect(typeof r.offlineAt$.get).toBe("function");
      expect(typeof r.onlineAt$.get).toBe("function");
      expect(typeof r.downlink$.get).toBe("function");
      expect(typeof r.downlinkMax$.get).toBe("function");
      expect(typeof r.effectiveType$.get).toBe("function");
      expect(typeof r.rtt$.get).toBe("function");
      expect(typeof r.saveData$.get).toBe("function");
      expect(typeof r.type$.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isOnline$ reflects navigator.onLine after mount", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result } = renderHook(() => useNetwork());
      expect(result.current.isOnline$.get()).toBe(true);
    });

    it("reads connection info after mount", () => {
      mockConnection({
        downlink: 5,
        effectiveType: "3g",
        rtt: 100,
        saveData: true,
        type: "cellular",
      });
      const { result } = renderHook(() => useNetwork());
      expect(result.current.downlink$.get()).toBe(5);
      expect(result.current.effectiveType$.get()).toBe("3g");
      expect(result.current.rtt$.get()).toBe(100);
      expect(result.current.saveData$.get()).toBe(true);
      expect(result.current.type$.get()).toBe("cellular");
    });

    it("isSupported$ is true when connection exists", () => {
      mockConnection();
      const { result } = renderHook(() => useNetwork());
      expect(result.current.isSupported$.get()).toBe(true);
    });
  });

  describe("online/offline events", () => {
    it("isOnline$ updates on online event", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
      const { result } = renderHook(() => useNetwork());

      act(() => {
        vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
        window.dispatchEvent(new Event("online"));
      });

      expect(result.current.isOnline$.get()).toBe(true);
      expect(result.current.onlineAt$.get()).toBeTypeOf("number");
      expect(result.current.offlineAt$.get()).toBeUndefined();
    });

    it("isOnline$ updates on offline event", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result } = renderHook(() => useNetwork());

      act(() => {
        vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
        window.dispatchEvent(new Event("offline"));
      });

      expect(result.current.isOnline$.get()).toBe(false);
      expect(result.current.offlineAt$.get()).toBeTypeOf("number");
      expect(result.current.onlineAt$.get()).toBeUndefined();
    });
  });

  describe("connection change event", () => {
    it("updates connection info on change event", () => {
      const conn = mockConnection({ downlink: 10, rtt: 50 });
      const { result } = renderHook(() => useNetwork());

      act(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mutation
        (conn as any).downlink = 2;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mutation
        (conn as any).rtt = 200;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mutation
        (conn as any).effectiveType = "2g";
        conn.dispatchChange();
      });

      expect(result.current.downlink$.get()).toBe(2);
      expect(result.current.rtt$.get()).toBe(200);
      expect(result.current.effectiveType$.get()).toBe("2g");
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listeners on unmount", async () => {
      const conn = mockConnection();
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useNetwork());
      unmount();
      await flush();

      const onlineAdded = addSpy.mock.calls.some(([type]) => type === "online");
      const onlineRemoved = removeSpy.mock.calls.some(([type]) => type === "online");
      const offlineAdded = addSpy.mock.calls.some(([type]) => type === "offline");
      const offlineRemoved = removeSpy.mock.calls.some(([type]) => type === "offline");

      expect(onlineAdded).toBe(true);
      expect(onlineRemoved).toBe(true);
      expect(offlineAdded).toBe(true);
      expect(offlineRemoved).toBe(true);
      expect(conn.removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
        undefined
      );
    });

    it("does not respond to events after unmount", async () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result, unmount } = renderHook(() => useNetwork());

      unmount();
      await flush();

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });

      // Value should remain as it was at unmount time (true)
      expect(result.current.isOnline$.get()).toBe(true);
    });
  });
});
