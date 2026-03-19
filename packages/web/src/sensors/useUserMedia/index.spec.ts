// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useUserMedia } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useUserMedia()", () => {
  let mockStream: {
    getTracks: ReturnType<typeof vi.fn>;
  };
  let mockTrack: {
    stop: ReturnType<typeof vi.fn>;
  };
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTrack = { stop: vi.fn() };
    mockStream = { getTracks: vi.fn(() => [mockTrack]) };
    getUserMediaMock = vi.fn(() => Promise.resolve(mockStream));

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaMock },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns observable fields and control functions", () => {
      const { result } = renderHook(() => useUserMedia());
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.stream$.get).toBe("function");
      expect(typeof result.current.enabled$.get).toBe("function");
      expect(typeof result.current.start).toBe("function");
      expect(typeof result.current.stop).toBe("function");
      expect(typeof result.current.restart).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when getUserMedia exists", () => {
      const { result } = renderHook(() => useUserMedia());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("stream$ is null initially", () => {
      const { result } = renderHook(() => useUserMedia());
      expect(result.current.stream$.get()).toBeNull();
    });

    it("enabled$ is false initially", () => {
      const { result } = renderHook(() => useUserMedia());
      expect(result.current.enabled$.get()).toBe(false);
    });
  });

  describe("start/stop controls", () => {
    it("start() calls getUserMedia and sets stream", async () => {
      const { result } = renderHook(() => useUserMedia());

      await act(async () => {
        await result.current.start();
      });

      expect(getUserMediaMock).toHaveBeenCalledWith({ audio: false, video: true });
      expect(result.current.stream$.get()).toBe(mockStream);
      expect(result.current.enabled$.get()).toBe(true);
    });

    it("start() uses custom constraints", async () => {
      const constraints = { audio: true, video: false };
      const { result } = renderHook(() => useUserMedia({ constraints }));

      await act(async () => {
        await result.current.start();
      });

      expect(getUserMediaMock).toHaveBeenCalledWith(constraints);
    });

    it("stop() stops all tracks and clears stream", async () => {
      const { result } = renderHook(() => useUserMedia());

      await act(async () => {
        await result.current.start();
      });

      act(() => {
        result.current.stop();
      });

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(result.current.stream$.get()).toBeNull();
      expect(result.current.enabled$.get()).toBe(false);
    });

    it("restart() stops then starts stream", async () => {
      const { result } = renderHook(() => useUserMedia());

      await act(async () => {
        await result.current.start();
      });

      await act(async () => {
        await result.current.restart();
      });

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(getUserMediaMock).toHaveBeenCalledTimes(2);
      expect(result.current.stream$.get()).toBe(mockStream);
    });

    it("handles getUserMedia rejection gracefully", async () => {
      getUserMediaMock.mockRejectedValueOnce(new Error("Permission denied"));

      const { result } = renderHook(() => useUserMedia());

      await act(async () => {
        await expect(result.current.start()).rejects.toThrow("Permission denied");
      });

      expect(result.current.stream$.get()).toBeNull();
      expect(result.current.enabled$.get()).toBe(false);
    });
  });

  describe("immediate option", () => {
    it("auto-starts when immediate is true", async () => {
      renderHook(() => useUserMedia({ immediate: true }));
      await act(async () => {
        await flush();
      });

      expect(getUserMediaMock).toHaveBeenCalled();
    });

    it("does not auto-start when immediate is false", async () => {
      renderHook(() => useUserMedia({ immediate: false }));
      await act(async () => {
        await flush();
      });

      expect(getUserMediaMock).not.toHaveBeenCalled();
    });
  });

  describe("unmount cleanup", () => {
    it("stops tracks on unmount", async () => {
      const { result, unmount } = renderHook(() => useUserMedia());

      await act(async () => {
        await result.current.start();
      });

      unmount();
      await flush();

      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });
});
