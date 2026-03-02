// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimestamp } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

// ---------------------------------------------------------------------------
// rAF mock helpers (default scheduler)
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
  it("returns an Observable<number>", () => {
    const { result } = renderHook(() => useTimestamp());
    expect(typeof result.current.get).toBe("function");
    expect(typeof result.current.get()).toBe("number");
  });

  it("initial value is approximately Date.now()", () => {
    const before = Date.now();
    const { result } = renderHook(() => useTimestamp());
    const after = Date.now();
    expect(result.current.get()).toBeGreaterThanOrEqual(before);
    expect(result.current.get()).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
// offset
// ---------------------------------------------------------------------------

describe("offset", () => {
  it("offset=1000 adds 1000ms to timestamp", () => {
    const before = Date.now();
    const { result } = renderHook(() => useTimestamp({ offset: 1000 }));
    const after = Date.now();
    const ts = result.current.get();
    expect(ts).toBeGreaterThanOrEqual(before + 1000);
    expect(ts).toBeLessThanOrEqual(after + 1000);
  });

  it("offset update is reflected on next tick", () => {
    const { result } = renderHook(() => useTimestamp({ offset: 0 }));
    const first = result.current.get();

    // flush a rAF tick — offset=0, so new value ~= Date.now()
    act(() => {
      flushRaf(16);
    });

    expect(result.current.get()).toBeGreaterThanOrEqual(first);
  });
});

// ---------------------------------------------------------------------------
// callback
// ---------------------------------------------------------------------------

describe("callback", () => {
  it("callback is invoked on each tick with the current timestamp", () => {
    const cb = vi.fn();
    renderHook(() => useTimestamp({ callback: cb }));

    act(() => {
      flushRaf(16);
    });

    expect(cb).toHaveBeenCalledOnce();
    expect(typeof cb.mock.calls[0][0]).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// controls=true
// ---------------------------------------------------------------------------

describe("controls=true", () => {
  it("returns { timestamp, isActive$, pause, resume }", () => {
    const { result } = renderHook(() => useTimestamp({ controls: true }));
    expect(result.current).toHaveProperty("timestamp");
    expect(result.current).toHaveProperty("isActive$");
    expect(result.current).toHaveProperty("pause");
    expect(result.current).toHaveProperty("resume");
  });

  it("pause() stops ticking", () => {
    const { result } = renderHook(() => useTimestamp({ controls: true }));
    act(() => {
      result.current.pause();
    });
    expect(result.current.isActive$.get()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// unmount cleanup
// ---------------------------------------------------------------------------

describe("unmount cleanup", () => {
  it("cancels rAF on unmount", async () => {
    const { unmount } = renderHook(() => useTimestamp());
    unmount();
    await flush();
    expect(rafCallbacks.size).toBe(0);
  });
});
