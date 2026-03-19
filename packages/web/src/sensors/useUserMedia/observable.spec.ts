// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useUserMedia } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const makeMockStream = () => ({
  getTracks: () => [{ stop: vi.fn() }],
});

beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn().mockResolvedValue(makeMockStream()),
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useUserMedia() — reactive options", () => {
  describe("Observable option change", () => {
    it("passing full options as observable works", async () => {
      const opts$ = observable({ constraints: { audio: false, video: true } });
      const { result } = renderHook(() => useUserMedia(opts$));

      await act(async () => {
        await result.current.start();
        await flush();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({ audio: false, video: true })
      );
    });

    it("constraints$ observable — changing before start() uses new constraints", async () => {
      const constraints$ = observable<MediaStreamConstraints>({ audio: false, video: true });

      const { result } = renderHook(() => useUserMedia({ constraints: constraints$ as any }));

      // Change constraints before start
      act(() => {
        constraints$.set({ audio: true, video: false });
      });

      await act(async () => {
        await result.current.start();
        await flush();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({ audio: true, video: false })
      );
    });

    it("restart() uses current constraints$ value", async () => {
      const constraints$ = observable<MediaStreamConstraints>({ audio: false, video: true });

      const { result } = renderHook(() => useUserMedia({ constraints: constraints$ as any }));

      await act(async () => {
        await result.current.start();
        await flush();
      });

      // Update constraints
      act(() => {
        constraints$.set({ audio: true, video: { width: 1280 } });
      });

      await act(async () => {
        await result.current.restart();
        await flush();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenLastCalledWith(
        expect.objectContaining({ audio: true, video: { width: 1280 } })
      );
    });

    it("enabled$ becomes true after start(), false after stop()", async () => {
      const { result } = renderHook(() => useUserMedia());

      expect(result.current.enabled$.get()).toBe(false);

      await act(async () => {
        await result.current.start();
        await flush();
      });

      expect(result.current.enabled$.get()).toBe(true);

      act(() => {
        result.current.stop();
      });
      expect(result.current.enabled$.get()).toBe(false);
    });

    it("per-field constraints observable — video$ change before start takes effect", async () => {
      const video$ = observable<boolean | MediaTrackConstraints>(true);

      const { result } = renderHook(() =>
        useUserMedia({ constraints: { audio: false, video: video$ as any } })
      );

      act(() => {
        video$.set({ width: 640, height: 480 });
      });

      await act(async () => {
        await result.current.start();
        await flush();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({ video: { width: 640, height: 480 } })
      );
    });
  });
});
