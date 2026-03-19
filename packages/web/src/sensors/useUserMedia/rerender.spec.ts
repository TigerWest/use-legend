// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useUserMedia } from ".";

describe("useUserMedia() — rerender stability", () => {
  let mockStream: { getTracks: ReturnType<typeof vi.fn> };
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStream = { getTracks: vi.fn(() => [{ stop: vi.fn() }]) };
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

  it("observable references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useUserMedia());
    const first = result.current;
    rerender();
    expect(result.current.isSupported$).toBe(first.isSupported$);
    expect(result.current.stream$).toBe(first.stream$);
    expect(result.current.enabled$).toBe(first.enabled$);
  });

  it("function references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useUserMedia());
    const firstStart = result.current.start;
    const firstStop = result.current.stop;
    const firstRestart = result.current.restart;
    rerender();
    expect(result.current.start).toBe(firstStart);
    expect(result.current.stop).toBe(firstStop);
    expect(result.current.restart).toBe(firstRestart);
  });

  it("stream persists across re-renders", async () => {
    const { result, rerender } = renderHook(() => useUserMedia());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.stream$.get()).toBe(mockStream);
    rerender();
    expect(result.current.stream$.get()).toBe(mockStream);
  });
});
