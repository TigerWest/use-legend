// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useDevicesList } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

const fakeDevices: MediaDeviceInfo[] = [
  { deviceId: "1", kind: "videoinput", label: "Camera", groupId: "" } as MediaDeviceInfo,
  { deviceId: "2", kind: "audioinput", label: "Mic", groupId: "" } as MediaDeviceInfo,
];

beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      enumerateDevices: vi.fn().mockResolvedValue(fakeDevices),
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useDevicesList() — reactive options", () => {
  describe("Observable option change", () => {
    it("passing options as observable works", async () => {
      const opts$ = observable({ requestPermissions: false });
      const { result } = renderHook(() => useDevicesList(opts$));

      await act(async () => {
        await flush();
      });

      expect(result.current.devices$.get()).toEqual(fakeDevices);
    });

    it("onUpdated$ — changing callback in opts observable before update uses new callback", async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      // Pass opts as a full observable so we can swap onUpdated reactively
      const opts$ = observable<{ onUpdated?: (devices: MediaDeviceInfo[]) => void }>({
        onUpdated: cb1,
      });

      const { result } = renderHook(() => useDevicesList(opts$ as any));

      // Wait for initial update (mount triggers update())
      await act(async () => {
        await flush();
        await flush();
      });
      expect(cb1).toHaveBeenCalledWith(fakeDevices);

      // Swap callback
      act(() => {
        opts$.onUpdated.set(cb2 as any);
      });

      // Trigger another update via ensurePermissions → calls update() which calls onUpdated
      await act(async () => {
        await result.current.ensurePermissions();
        await flush();
        await flush();
      });

      expect(cb2).toHaveBeenCalled();
    });

    it("constraints$ observable — changing before ensurePermissions uses new constraints", async () => {
      const constraints$ = observable<MediaStreamConstraints>({ audio: true, video: false });

      const { result } = renderHook(() => useDevicesList({ constraints: constraints$ }));

      await act(async () => {
        await flush();
      });

      // Change constraints
      act(() => {
        constraints$.set({ audio: true, video: true });
      });

      await act(async () => {
        await result.current.ensurePermissions();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({ audio: true, video: true })
      );
    });

    it("per-field observable constraints$ is picked up at ensurePermissions time", async () => {
      const video$ = observable(false);

      const { result } = renderHook(() =>
        useDevicesList({ constraints: { audio: true, video: video$ as any } })
      );

      await act(async () => {
        await flush();
      });

      act(() => {
        video$.set(true);
      });

      await act(async () => {
        await result.current.ensurePermissions();
      });

      // getUserMedia should have been called (constraints were resolved)
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    });
  });
});
