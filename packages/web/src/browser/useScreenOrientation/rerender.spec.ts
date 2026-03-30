// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useScreenOrientation } from ".";

function mockScreenOrientation(initial: { type?: string; angle?: number } = {}) {
  const listeners: Record<string, Array<() => void>> = {};
  const orientation = {
    type: initial.type ?? "portrait-primary",
    angle: initial.angle ?? 0,
    lock: vi.fn(() => Promise.resolve()),
    unlock: vi.fn(),
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
  Object.defineProperty(window.screen, "orientation", {
    value: orientation,
    configurable: true,
    writable: true,
  });
  return orientation;
}

describe("useScreenOrientation() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test cleanup
    delete (window.screen as any).orientation;
  });

  describe("resource stability", () => {
    it("does not re-register change listener on re-render", () => {
      const orientation = mockScreenOrientation();

      const { rerender } = renderHook(() => useScreenOrientation());

      const countAfterMount = orientation.addEventListener.mock.calls.filter(
        ([type]) => type === "change"
      ).length;

      rerender();
      rerender();
      rerender();

      const countAfterRerender = orientation.addEventListener.mock.calls.filter(
        ([type]) => type === "change"
      ).length;

      expect(countAfterRerender).toBe(countAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("returns stable observable references across re-renders", () => {
      mockScreenOrientation();

      const { result, rerender } = renderHook(() => useScreenOrientation());

      const before = result.current;
      rerender();
      const after = result.current;

      expect(before.isSupported$).toBe(after.isSupported$);
      expect(before.orientation$).toBe(after.orientation$);
      expect(before.angle$).toBe(after.angle$);
    });

    it("values are preserved after re-render", () => {
      const orientation = mockScreenOrientation();

      const { result, rerender } = renderHook(() => useScreenOrientation());

      act(() => {
        orientation.type = "landscape-primary";
        orientation.angle = 90;
        orientation.dispatchChange();
      });

      expect(result.current.orientation$.get()).toBe("landscape-primary");
      expect(result.current.angle$.get()).toBe(90);

      rerender();

      expect(result.current.orientation$.get()).toBe("landscape-primary");
      expect(result.current.angle$.get()).toBe(90);
    });
  });

  describe("callback freshness", () => {
    it("change events still update values after re-render", () => {
      const orientation = mockScreenOrientation();

      const { result, rerender } = renderHook(() => useScreenOrientation());

      rerender();
      rerender();
      rerender();

      act(() => {
        orientation.type = "landscape-secondary";
        orientation.angle = 270;
        orientation.dispatchChange();
      });

      expect(result.current.orientation$.get()).toBe("landscape-secondary");
      expect(result.current.angle$.get()).toBe(270);
    });
  });
});
