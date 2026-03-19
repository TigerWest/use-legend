// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useDisplayMedia } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("useDisplayMedia()", () => {
  let mockStream: {
    getTracks: ReturnType<typeof vi.fn>;
  };
  let mockTrack: {
    stop: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
  };
  let getDisplayMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTrack = {
      stop: vi.fn(),
      addEventListener: vi.fn(),
    };
    mockStream = { getTracks: vi.fn(() => [mockTrack]) };
    getDisplayMediaMock = vi.fn(() => Promise.resolve(mockStream));

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getDisplayMedia: getDisplayMediaMock },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("return shape", () => {
    it("returns observable fields and control functions", () => {
      const { result } = renderHook(() => useDisplayMedia());
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.stream$.get).toBe("function");
      expect(typeof result.current.enabled$.get).toBe("function");
      expect(typeof result.current.start).toBe("function");
      expect(typeof result.current.stop).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when getDisplayMedia exists", () => {
      const { result } = renderHook(() => useDisplayMedia());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("stream$ is null initially", () => {
      const { result } = renderHook(() => useDisplayMedia());
      expect(result.current.stream$.get()).toBeNull();
    });

    it("enabled$ is false initially", () => {
      const { result } = renderHook(() => useDisplayMedia());
      expect(result.current.enabled$.get()).toBe(false);
    });
  });

  describe("start/stop controls", () => {
    it("start() calls getDisplayMedia and sets stream", async () => {
      const { result } = renderHook(() => useDisplayMedia());

      await act(async () => {
        await result.current.start();
      });

      expect(getDisplayMediaMock).toHaveBeenCalledWith({ video: true, audio: false });
      expect(result.current.stream$.get()).toBe(mockStream);
      expect(result.current.enabled$.get()).toBe(true);
    });

    it("start() uses custom constraints", async () => {
      const { result } = renderHook(() => useDisplayMedia({ video: { width: 1920 }, audio: true }));

      await act(async () => {
        await result.current.start();
      });

      expect(getDisplayMediaMock).toHaveBeenCalledWith({
        video: { width: 1920 },
        audio: true,
      });
    });

    it("registers ended listener on tracks", async () => {
      const { result } = renderHook(() => useDisplayMedia());

      await act(async () => {
        await result.current.start();
      });

      expect(mockTrack.addEventListener).toHaveBeenCalledWith("ended", expect.any(Function), {
        once: true,
      });
    });

    it("stop() stops all tracks and clears stream", async () => {
      const { result } = renderHook(() => useDisplayMedia());

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

    it("throws and clears stream on getDisplayMedia rejection", async () => {
      getDisplayMediaMock.mockRejectedValueOnce(new Error("Permission denied"));

      const { result } = renderHook(() => useDisplayMedia());

      await expect(
        act(async () => {
          await result.current.start();
        })
      ).rejects.toThrow("Permission denied");

      expect(result.current.stream$.get()).toBeNull();
      expect(result.current.enabled$.get()).toBe(false);
    });
  });

  describe("unmount cleanup", () => {
    it("stops tracks on unmount", async () => {
      const { result, unmount } = renderHook(() => useDisplayMedia());

      await act(async () => {
        await result.current.start();
      });

      unmount();
      await flush();

      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });
});
