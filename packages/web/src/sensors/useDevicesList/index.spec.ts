// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDevicesList } from ".";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function createMockDevice(kind: MediaDeviceInfo["kind"], id: string): MediaDeviceInfo {
  return {
    deviceId: id,
    groupId: "group-1",
    kind,
    label: `${kind}-${id}`,
    toJSON: () => ({}),
  };
}

function mockMediaDevices(devices: MediaDeviceInfo[] = []) {
  const listeners: Record<string, Array<() => void>> = {};
  const mediaDevices = {
    enumerateDevices: vi.fn(async () => devices),
    getUserMedia: vi.fn(async () => ({
      getTracks: () => [{ stop: vi.fn() }],
    })),
    addEventListener: vi.fn((event: string, handler: () => void) => {
      (listeners[event] ??= []).push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: () => void) => {
      listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
    }),
    dispatchChange: () => {
      listeners["devicechange"]?.forEach((h) => h());
    },
  };

  Object.defineProperty(navigator, "mediaDevices", {
    value: mediaDevices,
    configurable: true,
    writable: true,
  });

  return mediaDevices;
}

describe("useDevicesList()", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).mediaDevices;
  });

  describe("return shape", () => {
    it("returns observable fields and ensurePermissions", () => {
      mockMediaDevices();
      const { result } = renderHook(() => useDevicesList());
      expect(typeof result.current.isSupported$.get).toBe("function");
      expect(typeof result.current.devices$.get).toBe("function");
      expect(typeof result.current.videoInputs$.get).toBe("function");
      expect(typeof result.current.audioInputs$.get).toBe("function");
      expect(typeof result.current.audioOutputs$.get).toBe("function");
      expect(typeof result.current.permissionGranted$.get).toBe("function");
      expect(typeof result.current.ensurePermissions).toBe("function");
    });
  });

  describe("initial values", () => {
    it("isSupported$ is true when mediaDevices exists", () => {
      mockMediaDevices();
      const { result } = renderHook(() => useDevicesList());
      expect(result.current.isSupported$.get()).toBe(true);
    });

    it("devices$ is initially empty", () => {
      mockMediaDevices();
      const { result } = renderHook(() => useDevicesList());
      expect(result.current.devices$.get()).toEqual([]);
    });

    it("permissionGranted$ is initially false", () => {
      mockMediaDevices();
      const { result } = renderHook(() => useDevicesList());
      expect(result.current.permissionGranted$.get()).toBe(false);
    });
  });

  describe("device enumeration", () => {
    it("enumerates devices on mount", async () => {
      const devices = [
        createMockDevice("videoinput", "cam-1"),
        createMockDevice("audioinput", "mic-1"),
        createMockDevice("audiooutput", "spk-1"),
      ];
      mockMediaDevices(devices);

      const { result } = renderHook(() => useDevicesList());
      await act(() => flush());

      expect(result.current.devices$.get()).toEqual(devices);
      expect(result.current.videoInputs$.get()).toHaveLength(1);
      expect(result.current.audioInputs$.get()).toHaveLength(1);
      expect(result.current.audioOutputs$.get()).toHaveLength(1);
    });

    it("filters devices by kind", async () => {
      const devices = [
        createMockDevice("videoinput", "cam-1"),
        createMockDevice("videoinput", "cam-2"),
        createMockDevice("audioinput", "mic-1"),
      ];
      mockMediaDevices(devices);

      const { result } = renderHook(() => useDevicesList());
      await act(() => flush());

      expect(result.current.videoInputs$.get()).toHaveLength(2);
      expect(result.current.audioInputs$.get()).toHaveLength(1);
      expect(result.current.audioOutputs$.get()).toHaveLength(0);
    });

    it("calls onUpdated callback", async () => {
      const devices = [createMockDevice("videoinput", "cam-1")];
      mockMediaDevices(devices);
      const onUpdated = vi.fn();

      renderHook(() => useDevicesList({ onUpdated }));
      await act(() => flush());

      expect(onUpdated).toHaveBeenCalledWith(devices);
    });
  });

  describe("devicechange event", () => {
    it("updates devices on devicechange", async () => {
      const initialDevices = [createMockDevice("videoinput", "cam-1")];
      const mock = mockMediaDevices(initialDevices);

      const { result } = renderHook(() => useDevicesList());
      await act(() => flush());
      expect(result.current.devices$.get()).toHaveLength(1);

      const newDevices = [
        createMockDevice("videoinput", "cam-1"),
        createMockDevice("audioinput", "mic-1"),
      ];
      mock.enumerateDevices.mockResolvedValue(newDevices);

      await act(async () => {
        mock.dispatchChange();
        await flush();
      });

      expect(result.current.devices$.get()).toHaveLength(2);
    });
  });

  describe("ensurePermissions", () => {
    it("requests permissions and updates devices", async () => {
      const devices = [createMockDevice("videoinput", "cam-1")];
      mockMediaDevices(devices);

      const { result } = renderHook(() => useDevicesList());

      let granted = false;
      await act(async () => {
        granted = await result.current.ensurePermissions();
      });

      expect(granted).toBe(true);
      expect(result.current.permissionGranted$.get()).toBe(true);
    });

    it("returns false when getUserMedia fails", async () => {
      const mock = mockMediaDevices();
      mock.getUserMedia.mockRejectedValue(new Error("NotAllowedError"));

      const { result } = renderHook(() => useDevicesList());

      let granted = false;
      await act(async () => {
        granted = await result.current.ensurePermissions();
      });

      expect(granted).toBe(false);
      expect(result.current.permissionGranted$.get()).toBe(false);
    });
  });

  describe("requestPermissions option", () => {
    it("auto-requests permissions on mount when requestPermissions=true", async () => {
      const devices = [createMockDevice("videoinput", "cam-1")];
      const mock = mockMediaDevices(devices);

      renderHook(() => useDevicesList({ requestPermissions: true }));
      await act(() => flush());

      expect(mock.getUserMedia).toHaveBeenCalled();
    });
  });

  describe("unmount cleanup", () => {
    it("removes devicechange listener on unmount", async () => {
      const mock = mockMediaDevices();
      const { unmount } = renderHook(() => useDevicesList());

      unmount();
      await flush();

      expect(mock.removeEventListener).toHaveBeenCalledWith(
        "devicechange",
        expect.any(Function),
        undefined
      );
    });
  });
});
