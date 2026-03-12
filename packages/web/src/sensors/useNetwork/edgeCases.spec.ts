// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useNetwork } from ".";

describe("useNetwork() — edge cases", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test cleanup
    delete (navigator as any).connection;
  });

  it("works without navigator.connection", () => {
    // No connection mock — navigator.connection is absent
    const { result } = renderHook(() => useNetwork());

    expect(result.current.isSupported$.get()).toBe(false);
    expect(result.current.downlink$.get()).toBeUndefined();
    expect(result.current.downlinkMax$.get()).toBeUndefined();
    expect(result.current.effectiveType$.get()).toBeUndefined();
    expect(result.current.rtt$.get()).toBeUndefined();
    expect(result.current.saveData$.get()).toBeUndefined();
    expect(result.current.type$.get()).toBe("unknown");

    // isOnline$ still works via navigator.onLine
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const { result: result2 } = renderHook(() => useNetwork());
    expect(result2.current.isOnline$.get()).toBe(true);
  });

  it("handles multiple online/offline toggles correctly", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const { result } = renderHook(() => useNetwork());

    // online → offline
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    const offlineAt1 = result.current.offlineAt$.get();
    expect(result.current.isOnline$.get()).toBe(false);
    expect(offlineAt1).toBeTypeOf("number");
    expect(result.current.onlineAt$.get()).toBeUndefined();

    // offline → online
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    const onlineAt1 = result.current.onlineAt$.get();
    expect(result.current.isOnline$.get()).toBe(true);
    expect(onlineAt1).toBeTypeOf("number");
    expect(result.current.offlineAt$.get()).toBeUndefined();

    // online → offline again
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    const offlineAt2 = result.current.offlineAt$.get();
    expect(result.current.isOnline$.get()).toBe(false);
    expect(offlineAt2).toBeTypeOf("number");
    expect(result.current.onlineAt$.get()).toBeUndefined();

    // offline → online again
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    const onlineAt2 = result.current.onlineAt$.get();
    expect(result.current.isOnline$.get()).toBe(true);
    expect(onlineAt2).toBeTypeOf("number");
    expect(result.current.offlineAt$.get()).toBeUndefined();
  });

  it("handles simultaneous online and connection change events", () => {
    const listeners: Record<string, Array<() => void>> = {};
    const connection = {
      downlink: 10,
      downlinkMax: undefined,
      effectiveType: "4g" as const,
      rtt: 50,
      saveData: false,
      type: "wifi" as const,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        (listeners[event] ??= []).push(handler);
      }),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(navigator, "connection", {
      value: connection,
      configurable: true,
      writable: true,
    });

    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const { result } = renderHook(() => useNetwork());

    act(() => {
      // Simulate online event and connection change in the same act()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mutation
      (connection as any).downlink = 20;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mutation
      (connection as any).effectiveType = "4g";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mutation
      (connection as any).type = "ethernet";
      listeners["change"]?.forEach((h) => h());
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline$.get()).toBe(true);
    expect(result.current.onlineAt$.get()).toBeTypeOf("number");
    expect(result.current.downlink$.get()).toBe(20);
    expect(result.current.type$.get()).toBe("ethernet");
  });
});
