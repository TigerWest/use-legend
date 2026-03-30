// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useScreenOrientation } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

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

describe("useScreenOrientation()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test cleanup
    delete (window.screen as any).orientation;
  });

  describe("return shape", () => {
    it("returns all expected fields", () => {
      mockScreenOrientation();
      const { result } = renderHook(() => useScreenOrientation());
      const r = result.current;
      expect(typeof r.isSupported$.get).toBe("function");
      expect(typeof r.orientation$.get).toBe("function");
      expect(typeof r.angle$.get).toBe("function");
      expect(typeof r.lockOrientation).toBe("function");
      expect(typeof r.unlockOrientation).toBe("function");
    });
  });

  describe("initial values", () => {
    it("orientation$ reads initial type from screen.orientation", () => {
      mockScreenOrientation({ type: "landscape-primary" });
      const { result } = renderHook(() => useScreenOrientation());
      expect(result.current.orientation$.get()).toBe("landscape-primary");
    });

    it("angle$ reads initial angle from screen.orientation", () => {
      mockScreenOrientation({ angle: 90 });
      const { result } = renderHook(() => useScreenOrientation());
      expect(result.current.angle$.get()).toBe(90);
    });

    it("isSupported$ is true when screen.orientation exists", () => {
      mockScreenOrientation();
      const { result } = renderHook(() => useScreenOrientation());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("isSupported$ is false when screen.orientation is absent", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test setup
      delete (window.screen as any).orientation;
      const { result } = renderHook(() => useScreenOrientation());
      expect(result.current.isSupported$.get()).toBe(false);
    });
  });

  describe("change event handling", () => {
    it("updates orientation$ on change event", () => {
      const orientation = mockScreenOrientation({ type: "portrait-primary" });
      const { result } = renderHook(() => useScreenOrientation());

      act(() => {
        orientation.type = "landscape-primary";
        orientation.dispatchChange();
      });

      expect(result.current.orientation$.get()).toBe("landscape-primary");
    });

    it("updates angle$ on change event", () => {
      const orientation = mockScreenOrientation({ angle: 0 });
      const { result } = renderHook(() => useScreenOrientation());

      act(() => {
        orientation.angle = 90;
        orientation.dispatchChange();
      });

      expect(result.current.angle$.get()).toBe(90);
    });

    it("updates both values at once on change event", () => {
      const orientation = mockScreenOrientation({ type: "portrait-primary", angle: 0 });
      const { result } = renderHook(() => useScreenOrientation());

      act(() => {
        orientation.type = "landscape-secondary";
        orientation.angle = 270;
        orientation.dispatchChange();
      });

      expect(result.current.orientation$.get()).toBe("landscape-secondary");
      expect(result.current.angle$.get()).toBe(270);
    });
  });

  describe("lockOrientation / unlockOrientation", () => {
    it("lockOrientation calls screen.orientation.lock with the given type", async () => {
      const orientation = mockScreenOrientation();
      const { result } = renderHook(() => useScreenOrientation());

      await act(async () => {
        await result.current.lockOrientation("landscape");
      });

      expect(orientation.lock).toHaveBeenCalledWith("landscape");
    });

    it("lockOrientation returns rejected promise when not supported", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test setup
      delete (window.screen as any).orientation;
      const { result } = renderHook(() => useScreenOrientation());

      await expect(result.current.lockOrientation("portrait")).rejects.toThrow("Not supported");
    });

    it("unlockOrientation calls screen.orientation.unlock", () => {
      const orientation = mockScreenOrientation();
      const { result } = renderHook(() => useScreenOrientation());

      act(() => {
        result.current.unlockOrientation();
      });

      expect(orientation.unlock).toHaveBeenCalled();
    });

    it("unlockOrientation does nothing when not supported", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test setup
      delete (window.screen as any).orientation;
      const { result } = renderHook(() => useScreenOrientation());

      expect(() => {
        act(() => {
          result.current.unlockOrientation();
        });
      }).not.toThrow();
    });
  });

  describe("unmount cleanup", () => {
    it("removes change event listener on unmount", async () => {
      const orientation = mockScreenOrientation();
      const { unmount } = renderHook(() => useScreenOrientation());

      unmount();
      await flush();

      expect(orientation.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("does not update values after unmount", async () => {
      const orientation = mockScreenOrientation({ type: "portrait-primary", angle: 0 });
      const { result, unmount } = renderHook(() => useScreenOrientation());

      unmount();
      await flush();

      act(() => {
        orientation.type = "landscape-primary";
        orientation.angle = 90;
        orientation.dispatchChange();
      });

      expect(result.current.orientation$.get()).toBe("portrait-primary");
      expect(result.current.angle$.get()).toBe(0);
    });
  });

  describe("SSR guard", () => {
    it("isSupported$ is false when screen.orientation is not defined", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test setup
      delete (window.screen as any).orientation;
      const { result } = renderHook(() => useScreenOrientation());
      expect(result.current.isSupported$.get()).toBe(false);
    });
  });
});
