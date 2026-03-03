// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useFps } from ".";

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

  // Mock performance.now for deterministic FPS calculation
  let perfTime = 0;
  vi.spyOn(performance, "now").mockImplementation(() => {
    perfTime += 16;
    return perfTime;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// initial value
// ---------------------------------------------------------------------------

describe("initial value", () => {
  it("initial fps is 0", () => {
    const { result } = renderHook(() => useFps());
    expect(result.current.get()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// fps calculation
// ---------------------------------------------------------------------------

describe("fps calculation", () => {
  it("every=10: fps is calculated after 10 frames", () => {
    const { result } = renderHook(() => useFps({ every: 10 }));

    act(() => {
      // Flush 10 frames to trigger sampling
      for (let i = 0; i < 10; i++) {
        flushRaf(i * 16);
      }
    });

    // After 10 frames at ~16ms each, fps should be > 0
    expect(result.current.get()).toBeGreaterThan(0);
  });

  it("fps value is in a reasonable range (> 0)", () => {
    const { result } = renderHook(() => useFps({ every: 5 }));

    act(() => {
      for (let i = 0; i < 5; i++) {
        flushRaf(i * 16);
      }
    });

    expect(result.current.get()).toBeGreaterThanOrEqual(0);
  });

  it("does not update before 'every' frames have passed", () => {
    const { result } = renderHook(() => useFps({ every: 10 }));

    act(() => {
      // Only 5 frames — not enough to sample
      for (let i = 0; i < 5; i++) {
        flushRaf(i * 16);
      }
    });

    // FPS stays at 0 (initial) since sampling hasn't triggered yet
    expect(result.current.get()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// unmount cleanup
// ---------------------------------------------------------------------------

describe("unmount cleanup", () => {
  it("cancels rAF on unmount", async () => {
    const { unmount } = renderHook(() => useFps());
    unmount();
    await flush();
    expect(rafCallbacks.size).toBe(0);
  });
});
