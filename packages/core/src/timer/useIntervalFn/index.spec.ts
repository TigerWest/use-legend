// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIntervalFn } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// immediate option
// ---------------------------------------------------------------------------

describe("immediate", () => {
  it("immediate=true (default) → interval runs after mount", () => {
    const cb = vi.fn();
    renderHook(() => useIntervalFn(cb, 1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).toHaveBeenCalledOnce();
  });

  it("immediate=false → cb not called even after interval", () => {
    const cb = vi.fn();
    renderHook(() => useIntervalFn(cb, 1000, { immediate: false }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// pause / resume
// ---------------------------------------------------------------------------

describe("pause / resume", () => {
  it("pause() stops the interval — cb not called after pause + advance", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useIntervalFn(cb, 1000));

    act(() => {
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(cb).not.toHaveBeenCalled();
  });

  it("resume() restarts the interval after pause", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useIntervalFn(cb, 1000));

    act(() => {
      result.current.pause();
    });

    act(() => {
      result.current.resume();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).toHaveBeenCalledOnce();
  });

  it("pause() is idempotent — calling twice does not throw", () => {
    const { result } = renderHook(() => useIntervalFn(vi.fn(), 1000));

    expect(() => {
      act(() => {
        result.current.pause();
        result.current.pause();
      });
    }).not.toThrow();
  });

  it("resume() is idempotent — calling twice does not start two intervals", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useIntervalFn(cb, 1000, { immediate: false }));

    act(() => {
      result.current.resume();
      result.current.resume(); // second call is no-op
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).toHaveBeenCalledOnce(); // not twice
  });
});

// ---------------------------------------------------------------------------
// isActive state
// ---------------------------------------------------------------------------

describe("isActive state", () => {
  it("isActive=true after mount (immediate=true)", () => {
    const { result } = renderHook(() => useIntervalFn(vi.fn(), 1000));
    expect(result.current.isActive$.get()).toBe(true);
  });

  it("isActive=false after pause()", () => {
    const { result } = renderHook(() => useIntervalFn(vi.fn(), 1000));

    act(() => {
      result.current.pause();
    });

    expect(result.current.isActive$.get()).toBe(false);
  });

  it("isActive=true after resume()", () => {
    const { result } = renderHook(() => useIntervalFn(vi.fn(), 1000));

    act(() => {
      result.current.pause();
      result.current.resume();
    });

    expect(result.current.isActive$.get()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// immediateCallback
// ---------------------------------------------------------------------------

describe("immediateCallback", () => {
  it("immediateCallback=true → cb called immediately when resume() is called", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      useIntervalFn(cb, 1000, { immediate: false, immediateCallback: true })
    );

    act(() => {
      result.current.resume();
    });

    expect(cb).toHaveBeenCalledOnce(); // fired immediately, before interval tick
  });

  it("immediateCallback=false (default) → cb not called immediately on resume()", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      useIntervalFn(cb, 1000, { immediate: false, immediateCallback: false })
    );

    act(() => {
      result.current.resume();
    });

    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// default interval
// ---------------------------------------------------------------------------

describe("default interval", () => {
  it("interval defaults to 1000ms when not provided", () => {
    const cb = vi.fn();
    renderHook(() => useIntervalFn(cb)); // no interval arg

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(cb).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Unmount cleanup
// ---------------------------------------------------------------------------

describe("unmount cleanup", () => {
  it("interval is cleared on unmount — cb not called after unmount", async () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useIntervalFn(cb, 1000));

    unmount();
    await flush(); // allow React effect cleanup to run

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(cb).not.toHaveBeenCalled();
  });
});
