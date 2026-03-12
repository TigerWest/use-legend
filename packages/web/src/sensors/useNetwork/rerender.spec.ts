// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useNetwork } from ".";

describe("useNetwork() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test cleanup
    delete (navigator as any).connection;
  });

  describe("resource stability", () => {
    it("does not re-register window listeners on re-render", () => {
      const addSpy = vi.spyOn(window, "addEventListener");

      const { rerender } = renderHook(() => useNetwork());

      const onlineCountAfterMount = addSpy.mock.calls.filter(([type]) => type === "online").length;
      const offlineCountAfterMount = addSpy.mock.calls.filter(
        ([type]) => type === "offline"
      ).length;

      rerender();
      rerender();
      rerender();

      const onlineCountAfterRerender = addSpy.mock.calls.filter(
        ([type]) => type === "online"
      ).length;
      const offlineCountAfterRerender = addSpy.mock.calls.filter(
        ([type]) => type === "offline"
      ).length;

      expect(onlineCountAfterRerender).toBe(onlineCountAfterMount);
      expect(offlineCountAfterRerender).toBe(offlineCountAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("returns stable Observable references across re-renders", () => {
      const { result, rerender } = renderHook(() => useNetwork());

      const before = result.current;

      rerender();

      const after = result.current;

      expect(before.isSupported$).toBe(after.isSupported$);
      expect(before.isOnline$).toBe(after.isOnline$);
      expect(before.offlineAt$).toBe(after.offlineAt$);
      expect(before.onlineAt$).toBe(after.onlineAt$);
      expect(before.downlink$).toBe(after.downlink$);
      expect(before.downlinkMax$).toBe(after.downlinkMax$);
      expect(before.effectiveType$).toBe(after.effectiveType$);
      expect(before.rtt$).toBe(after.rtt$);
      expect(before.saveData$).toBe(after.saveData$);
      expect(before.type$).toBe(after.type$);
    });

    it("isOnline$ remains correct after re-render", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result, rerender } = renderHook(() => useNetwork());

      expect(result.current.isOnline$.get()).toBe(true);

      rerender();
      expect(result.current.isOnline$.get()).toBe(true);

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });

      expect(result.current.isOnline$.get()).toBe(false);

      rerender();
      expect(result.current.isOnline$.get()).toBe(false);
    });
  });

  describe("callback freshness", () => {
    it("online/offline events still update isOnline$ after re-render", () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const { result, rerender } = renderHook(() => useNetwork());

      rerender();
      rerender();

      act(() => {
        window.dispatchEvent(new Event("offline"));
      });
      expect(result.current.isOnline$.get()).toBe(false);

      rerender();

      act(() => {
        window.dispatchEvent(new Event("online"));
      });
      expect(result.current.isOnline$.get()).toBe(true);
    });
  });
});
