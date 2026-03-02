// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimeoutFn } from ".";

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
  it("immediate=true (default) → start() called on mount, cb fires after interval", () => {
    const cb = vi.fn();
    renderHook(() => useTimeoutFn(cb, 1000));

    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).toHaveBeenCalledOnce();
  });

  it("immediate=false → cb not called after mount + interval", () => {
    const cb = vi.fn();
    renderHook(() => useTimeoutFn(cb, 1000, { immediate: false }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// stop()
// ---------------------------------------------------------------------------

describe("stop()", () => {
  it("stop() while pending → cb not called, isPending becomes false", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useTimeoutFn(cb, 1000));

    act(() => {
      result.current.stop();
    });

    expect(result.current.isPending.get()).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// start() re-entry (timer reset / debounce behaviour)
// ---------------------------------------------------------------------------

describe("start() re-entry", () => {
  it("calling start() again resets the timer — only the second fires", () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useTimeoutFn(cb, 1000, { immediate: false }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(500); // halfway through first timer
    });

    // reset timer
    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(500); // 500ms into second timer — not yet done
    });

    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500); // complete second timer
    });

    expect(cb).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// isPending state
// ---------------------------------------------------------------------------

describe("isPending state", () => {
  it("isPending=true immediately after start(), false after timer fires", () => {
    const { result } = renderHook(() => useTimeoutFn(vi.fn(), 1000, { immediate: false }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isPending.get()).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isPending.get()).toBe(false);
  });

  it("isPending=false after stop()", () => {
    const { result } = renderHook(() => useTimeoutFn(vi.fn(), 1000));

    act(() => {
      result.current.stop();
    });

    expect(result.current.isPending.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// MaybeObservable interval
// ---------------------------------------------------------------------------

describe("MaybeObservable interval", () => {
  it("observable interval — start() uses current value at call time", () => {
    const cb = vi.fn();
    const delay$ = observable(500);
    const { result } = renderHook(() => useTimeoutFn(cb, delay$, { immediate: false }));

    // change delay before calling start
    act(() => {
      delay$.set(2000);
    });

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(cb).not.toHaveBeenCalled(); // 500ms not enough for 2000ms timer

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(cb).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Unmount cleanup
// ---------------------------------------------------------------------------

describe("unmount cleanup", () => {
  it("pending timer is stopped when component unmounts — cb not called after unmount", async () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useTimeoutFn(cb, 1000));

    unmount();
    await flush(); // allow React effect cleanup to run

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// immediateCallback
// ---------------------------------------------------------------------------

describe("immediateCallback", () => {
  it("immediateCallback=true → cb called immediately (no args) when start() is called", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      useTimeoutFn(cb, 1000, { immediate: false, immediateCallback: true })
    );

    act(() => {
      result.current.start();
    });

    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(); // no args
  });

  it("immediateCallback=true → cb called again with args after delay", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      useTimeoutFn(cb as unknown as (x: string) => void, 1000, {
        immediate: false,
        immediateCallback: true,
      })
    );

    act(() => {
      result.current.start("hello");
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenNthCalledWith(1); // immediate: no args
    expect(cb).toHaveBeenNthCalledWith(2, "hello"); // delayed: with args
  });

  it("immediateCallback=false (default) → cb not called immediately on start()", () => {
    const cb = vi.fn();
    const { result } = renderHook(() =>
      useTimeoutFn(cb, 1000, { immediate: false, immediateCallback: false })
    );

    act(() => {
      result.current.start();
    });

    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// start() args forwarding
// ---------------------------------------------------------------------------

describe("start() args", () => {
  it("start(arg1, arg2) passes args to cb", () => {
    const cb = vi.fn();
    // Cast to typed function so useTimeoutFn infers Parameters<CallbackFn> correctly
    const { result } = renderHook(() =>
      useTimeoutFn(cb as unknown as (x: string, y: number) => void, 100, { immediate: false })
    );

    act(() => {
      result.current.start("hello", 42);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(cb).toHaveBeenCalledWith("hello", 42);
  });
});
