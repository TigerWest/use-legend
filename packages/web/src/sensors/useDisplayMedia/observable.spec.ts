// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useDisplayMedia } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const makeMockStream = () => ({
  getTracks: () => [{ addEventListener: vi.fn(), stop: vi.fn() }],
});

beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getDisplayMedia: vi.fn().mockResolvedValue(makeMockStream()),
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useDisplayMedia() — reactive options", () => {
  describe("Observable option change", () => {
    it("passing full options as observable works", async () => {
      const opts$ = observable({ video: true, audio: false });
      const { result } = renderHook(() => useDisplayMedia(opts$));

      await act(async () => {
        await result.current.start();
        await flush();
      });

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({ video: true, audio: false })
      );
    });

    it("video$ observable — changing before start() uses new video value", async () => {
      const video$ = observable<boolean | MediaTrackConstraints>(true);

      const { result } = renderHook(() => useDisplayMedia({ video: video$ as any }));

      // Change video constraint before calling start
      act(() => {
        video$.set({ frameRate: 30 });
      });

      await act(async () => {
        await result.current.start();
        await flush();
      });

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({ video: { frameRate: 30 } })
      );
    });

    it("audio$ observable — changing from false to true before start() uses audio=true", async () => {
      const audio$ = observable(false);

      const { result } = renderHook(() => useDisplayMedia({ audio: audio$ as any }));

      // Change audio to true before start
      act(() => {
        audio$.set(true);
      });

      await act(async () => {
        await result.current.start();
        await flush();
      });

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({ audio: true })
      );
    });

    it("per-field video$ and audio$ observables are read at start() time", async () => {
      const video$ = observable(false);
      const audio$ = observable(false);

      const { result } = renderHook(() =>
        useDisplayMedia({ video: video$ as any, audio: audio$ as any })
      );

      act(() => {
        video$.set(true);
        audio$.set(true);
      });

      await act(async () => {
        await result.current.start();
        await flush();
      });

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
        expect.objectContaining({ video: true, audio: true })
      );
    });

    it("enabled$ becomes true after successful start()", async () => {
      const { result } = renderHook(() => useDisplayMedia({ video: true }));

      expect(result.current.enabled$.get()).toBe(false);

      await act(async () => {
        await result.current.start();
        await flush();
      });

      expect(result.current.enabled$.get()).toBe(true);
    });
  });
});
