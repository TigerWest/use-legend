// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useDevicePixelRatio } from ".";

type MediaChangeHandler = () => void;

function createMockMatchMedia() {
  let handler: MediaChangeHandler | null = null;
  const mql = {
    matches: true,
    media: "",
    addEventListener: vi.fn((_event: string, h: MediaChangeHandler) => {
      handler = h;
    }),
    removeEventListener: vi.fn((_event: string, _h: MediaChangeHandler) => {
      handler = null;
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
    triggerChange: () => {
      handler?.();
    },
  };
  const matchMediaMock = vi.fn(() => mql);
  Object.defineProperty(window, "matchMedia", {
    value: matchMediaMock,
    configurable: true,
    writable: true,
  });
  return { mql, matchMediaMock };
}

describe("useDevicePixelRatio()", () => {
  let originalDpr: number;

  beforeEach(() => {
    originalDpr = window.devicePixelRatio;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "devicePixelRatio", {
      value: originalDpr,
      configurable: true,
      writable: true,
    });
  });

  describe("return shape", () => {
    it("returns observable fields", () => {
      createMockMatchMedia();
      const { result } = renderHook(() => useDevicePixelRatio());
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.pixelRatio$.get).toBe("function");
    });
  });

  describe("initial values", () => {
    it("pixelRatio$ reflects window.devicePixelRatio", () => {
      createMockMatchMedia();
      Object.defineProperty(window, "devicePixelRatio", {
        value: 2,
        configurable: true,
        writable: true,
      });
      const { result } = renderHook(() => useDevicePixelRatio());
      expect(result.current.pixelRatio$.get()).toBe(2);
    });

    it("isSupported$ is true when matchMedia exists", () => {
      createMockMatchMedia();
      const { result } = renderHook(() => useDevicePixelRatio());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("defaults to 1 when devicePixelRatio is undefined", () => {
      Object.defineProperty(window, "devicePixelRatio", {
        value: undefined,
        configurable: true,
        writable: true,
      });
      createMockMatchMedia();
      const { result } = renderHook(() => useDevicePixelRatio());
      // devicePixelRatio is undefined, but the hook defaults to 1 via ?? 1
      expect(result.current.pixelRatio$.get()).toBe(1);
    });
  });

  describe("DPR change detection", () => {
    it("updates pixelRatio$ when DPR changes", () => {
      const { mql } = createMockMatchMedia();
      Object.defineProperty(window, "devicePixelRatio", {
        value: 1,
        configurable: true,
        writable: true,
      });
      const { result } = renderHook(() => useDevicePixelRatio());
      expect(result.current.pixelRatio$.get()).toBe(1);

      act(() => {
        Object.defineProperty(window, "devicePixelRatio", {
          value: 2,
          configurable: true,
          writable: true,
        });
        mql.triggerChange();
      });

      expect(result.current.pixelRatio$.get()).toBe(2);
    });

    it("re-registers matchMedia listener after DPR change", () => {
      const { matchMediaMock, mql } = createMockMatchMedia();
      Object.defineProperty(window, "devicePixelRatio", {
        value: 1,
        configurable: true,
        writable: true,
      });
      renderHook(() => useDevicePixelRatio());

      // Initial call for DPR 1
      const initialCallCount = matchMediaMock.mock.calls.length;

      act(() => {
        Object.defineProperty(window, "devicePixelRatio", {
          value: 2,
          configurable: true,
          writable: true,
        });
        mql.triggerChange();
      });

      // Should have called matchMedia again with new DPR
      expect(matchMediaMock.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe("unmount cleanup", () => {
    it("removes event listener on unmount", async () => {
      const { mql } = createMockMatchMedia();
      const { unmount } = renderHook(() => useDevicePixelRatio());

      unmount();
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("does not update after unmount", async () => {
      const { mql } = createMockMatchMedia();
      Object.defineProperty(window, "devicePixelRatio", {
        value: 1,
        configurable: true,
        writable: true,
      });
      const { result, unmount } = renderHook(() => useDevicePixelRatio());

      unmount();
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      act(() => {
        Object.defineProperty(window, "devicePixelRatio", {
          value: 3,
          configurable: true,
          writable: true,
        });
        mql.triggerChange();
      });

      expect(result.current.pixelRatio$.get()).toBe(1);
    });
  });
});
