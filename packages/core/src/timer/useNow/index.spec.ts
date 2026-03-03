// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useNow } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

// ---------------------------------------------------------------------------
// rAF mock helpers
// ---------------------------------------------------------------------------

let rafCallbacks: Map<number, FrameRequestCallback>;
let rafId: number;

const flushRaf = (timestamp = 16) => {
  const cbs = [...rafCallbacks.values()];
  rafCallbacks.clear();
  cbs.forEach((cb) => cb(timestamp));
};

beforeEach(() => {
  rafCallbacks = new Map();
  rafId = 0;

  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    rafCallbacks.set(++rafId, cb);
    return rafId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    rafCallbacks.delete(id);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// basic
// ---------------------------------------------------------------------------

describe("basic", () => {
  it("returns an Observable<Date> (has .get())", () => {
    const { result } = renderHook(() => useNow());
    expect(typeof result.current.get).toBe("function");
    expect(result.current.get()).toBeInstanceOf(Date);
  });

  it("initial value is approximately the current time", () => {
    const before = Date.now();
    const { result } = renderHook(() => useNow());
    const after = Date.now();
    const ts = result.current.get().getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("updates now$ on each rAF tick", () => {
    const { result } = renderHook(() => useNow());
    const first = result.current.get().getTime();

    act(() => {
      flushRaf(16);
    });

    expect(result.current.get().getTime()).toBeGreaterThanOrEqual(first);
  });
});

// ---------------------------------------------------------------------------
// controls=true
// ---------------------------------------------------------------------------

describe("controls=true", () => {
  it("returns { now$, isActive$, pause, resume }", () => {
    const { result } = renderHook(() => useNow({ controls: true }));
    expect(result.current).toHaveProperty("now$");
    expect(result.current).toHaveProperty("isActive$");
    expect(result.current).toHaveProperty("pause");
    expect(result.current).toHaveProperty("resume");
  });

  it("pause() stops updates", () => {
    const { result } = renderHook(() => useNow({ controls: true }));
    act(() => {
      result.current.pause();
      flushRaf();
    });
    // isActive should be false after pause
    expect(result.current.isActive$.get()).toBe(false);
  });

  it("resume() restarts updates", () => {
    const { result } = renderHook(() => useNow({ controls: true }));
    act(() => {
      result.current.pause();
      result.current.resume();
    });
    expect(result.current.isActive$.get()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// interval=number (setInterval-based)
// ---------------------------------------------------------------------------

describe("interval=number", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("interval=1000: updates now$ every 1000ms", () => {
    const { result } = renderHook(() => useNow({ interval: 1000 }));
    const first = result.current.get().getTime();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.get().getTime()).toBeGreaterThanOrEqual(first);
  });
});

// ---------------------------------------------------------------------------
// unmount cleanup
// ---------------------------------------------------------------------------

describe("unmount cleanup", () => {
  it("cancels rAF loop on unmount", async () => {
    const { unmount } = renderHook(() => useNow());
    unmount();
    await flush();
    // No pending rAF callbacks remain
    expect(rafCallbacks.size).toBe(0);
  });
});
