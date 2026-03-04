// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useThrottleFn } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useThrottleFn() — edge cases", () => {
  it("ms=0 — executes synchronously without delay", () => {
    const cb = vi.fn().mockReturnValue("sync-result");
    const { result } = renderHook(() => useThrottleFn(cb, 0));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    // With ms=0, every call should execute
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("rapid sequential calls — last call arguments are used for trailing", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useThrottleFn(cb, 300));

    act(() => {
      result.current("a"); // leading fires with "a"
      result.current("b"); // suppressed, queued
      result.current("c"); // suppressed, replaces "b" in queue
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("a");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Trailing fires with last arguments "c"
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith("c");
  });

  it("calling throttled function after unmount does not throw", () => {
    const cb = vi.fn();
    const { result, unmount } = renderHook(() => useThrottleFn(cb, 300));

    const throttledFn = result.current;
    unmount();

    // Must not throw when called post-unmount
    expect(() => {
      throttledFn();
    }).not.toThrow();
  });

  it("multiple separate intervals — fires correctly across windows", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useThrottleFn(cb, 200, { edges: ["leading"] }));

    // First window
    act(() => {
      result.current();
    });

    expect(cb).toHaveBeenCalledTimes(1);

    // Wait for window to expire
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Second window
    act(() => {
      result.current();
    });

    expect(cb).toHaveBeenCalledTimes(2);

    // Wait for window to expire
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Third window
    act(() => {
      result.current();
    });

    expect(cb).toHaveBeenCalledTimes(3);
  });
});
