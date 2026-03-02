// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimeout } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// basic
// ---------------------------------------------------------------------------

describe("basic", () => {
  it("initial ready=false (timeout pending)", () => {
    const { result } = renderHook(() => useTimeout(1000));
    expect(result.current.get()).toBe(false);
  });

  it("ready=true after timeout fires", () => {
    const { result } = renderHook(() => useTimeout(1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.get()).toBe(true);
  });

  it("ready=false before timeout completes", () => {
    const { result } = renderHook(() => useTimeout(1000));

    act(() => {
      vi.advanceTimersByTime(999);
    });

    expect(result.current.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// callback
// ---------------------------------------------------------------------------

describe("callback", () => {
  it("callback is invoked when timeout fires", () => {
    const cb = vi.fn();
    renderHook(() => useTimeout(500, { callback: cb }));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(cb).toHaveBeenCalledOnce();
  });

  it("callback is not called before timeout", () => {
    const cb = vi.fn();
    renderHook(() => useTimeout(500, { callback: cb }));

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// controls=true
// ---------------------------------------------------------------------------

describe("controls=true", () => {
  it("returns { ready, isPending$, start, stop }", () => {
    const { result } = renderHook(() => useTimeout(1000, { controls: true }));
    expect(result.current).toHaveProperty("ready");
    expect(result.current).toHaveProperty("isPending$");
    expect(result.current).toHaveProperty("start");
    expect(result.current).toHaveProperty("stop");
  });

  it("stop() cancels the timeout — ready stays false", () => {
    const { result } = renderHook(() => useTimeout(1000, { controls: true }));

    act(() => {
      result.current.stop();
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.ready.get()).toBe(false);
  });

  it("isPending=true while timeout is running", () => {
    const { result } = renderHook(() => useTimeout(1000, { controls: true }));
    expect(result.current.isPending$.get()).toBe(true);
  });

  it("isPending=false after timeout fires", () => {
    const { result } = renderHook(() => useTimeout(1000, { controls: true }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isPending$.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// immediate=false
// ---------------------------------------------------------------------------

describe("immediate=false", () => {
  it("does not start on mount — ready stays false after advance", () => {
    const { result } = renderHook(() => useTimeout(1000, { immediate: false }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // ready stays false because timeout never started
    expect(result.current.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// unmount cleanup
// ---------------------------------------------------------------------------

describe("unmount cleanup", () => {
  it("clears timeout on unmount", async () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useTimeout(1000, { callback: cb }));

    unmount();
    await flush();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).not.toHaveBeenCalled();
  });
});
