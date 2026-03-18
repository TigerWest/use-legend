// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useDevicesList } from ".";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function mockMediaDevices() {
  const mediaDevices = {
    enumerateDevices: vi.fn(async () => [] as MediaDeviceInfo[]),
    getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(navigator, "mediaDevices", {
    value: mediaDevices,
    configurable: true,
    writable: true,
  });
  return mediaDevices;
}

describe("useDevicesList() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).mediaDevices;
  });

  it("observable references are stable across re-renders", () => {
    mockMediaDevices();
    const { result, rerender } = renderHook(() => useDevicesList());
    const first = result.current;
    rerender();
    expect(result.current.isSupported$).toBe(first.isSupported$);
    expect(result.current.devices$).toBe(first.devices$);
    expect(result.current.videoInputs$).toBe(first.videoInputs$);
    expect(result.current.audioInputs$).toBe(first.audioInputs$);
    expect(result.current.audioOutputs$).toBe(first.audioOutputs$);
    expect(result.current.permissionGranted$).toBe(first.permissionGranted$);
  });

  it("ensurePermissions function reference is stable", () => {
    mockMediaDevices();
    const { result, rerender } = renderHook(() => useDevicesList());
    const first = result.current.ensurePermissions;
    rerender();
    expect(result.current.ensurePermissions).toBe(first);
  });

  it("devices persist across re-renders", async () => {
    const mock = mockMediaDevices();
    mock.enumerateDevices.mockResolvedValue([
      {
        deviceId: "cam-1",
        groupId: "g1",
        kind: "videoinput",
        label: "Camera",
        toJSON: () => ({}),
      } as MediaDeviceInfo,
    ]);

    const { result, rerender } = renderHook(() => useDevicesList());
    await act(() => flush());
    expect(result.current.devices$.get()).toHaveLength(1);

    rerender();
    expect(result.current.devices$.get()).toHaveLength(1);
  });

  it("does not re-register devicechange listener on re-render", () => {
    const mock = mockMediaDevices();
    const { rerender } = renderHook(() => useDevicesList());
    const callsAfterMount = mock.addEventListener.mock.calls.length;
    rerender();
    rerender();
    expect(mock.addEventListener.mock.calls.length).toBe(callsAfterMount);
  });
});
