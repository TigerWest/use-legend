// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useInterval } from ".";

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
  it("initial counter=0", () => {
    const { result } = renderHook(() => useInterval(1000));
    expect(result.current.get()).toBe(0);
  });

  it("counter increments by 1 each interval", () => {
    const { result } = renderHook(() => useInterval(1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.get()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.get()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// callback
// ---------------------------------------------------------------------------

describe("callback", () => {
  it("callback(count) is called on each tick with current counter", () => {
    const cb = vi.fn();
    renderHook(() => useInterval(1000, { callback: cb }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(1);
  });

  it("callback receives incrementing count", () => {
    const counts: number[] = [];
    renderHook(() => useInterval(1000, { callback: (c) => counts.push(c) }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(counts).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// controls=true
// ---------------------------------------------------------------------------

describe("controls=true", () => {
  it("returns { counter$, reset, isActive$, pause, resume }", () => {
    const { result } = renderHook(() => useInterval(1000, { controls: true }));
    expect(result.current).toHaveProperty("counter$");
    expect(result.current).toHaveProperty("reset");
    expect(result.current).toHaveProperty("isActive$");
    expect(result.current).toHaveProperty("pause");
    expect(result.current).toHaveProperty("resume");
  });

  it("reset() resets counter to 0", () => {
    const { result } = renderHook(() => useInterval(1000, { controls: true }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.counter$.get()).toBe(3);

    act(() => {
      result.current.reset();
    });
    expect(result.current.counter$.get()).toBe(0);
  });

  it("pause() stops counter from incrementing", () => {
    const { result } = renderHook(() => useInterval(1000, { controls: true }));

    act(() => {
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.counter$.get()).toBe(0);
  });

  it("resume() restarts the interval", () => {
    const { result } = renderHook(() => useInterval(1000, { controls: true }));

    act(() => {
      result.current.pause();
      result.current.resume();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.counter$.get()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// immediate=false
// ---------------------------------------------------------------------------

describe("immediate=false", () => {
  it("does not start on mount", () => {
    const { result } = renderHook(() => useInterval(1000, { immediate: false }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.get()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// unmount cleanup
// ---------------------------------------------------------------------------

describe("unmount cleanup", () => {
  it("interval is cleared on unmount", async () => {
    const { result, unmount } = renderHook(() => useInterval(1000, { controls: true }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.counter$.get()).toBe(1);

    unmount();
    await flush();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // counter stays at 1 — interval was cleared
    expect(result.current.counter$.get()).toBe(1);
  });
});
