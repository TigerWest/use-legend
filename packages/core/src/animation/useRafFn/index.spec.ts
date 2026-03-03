// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRafFn } from ".";

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
// immediate option
// ---------------------------------------------------------------------------

describe("immediate", () => {
  it("immediate=true (default) → loop starts after mount, fn called after flushRaf", () => {
    const fn = vi.fn();
    renderHook(() => useRafFn(fn));

    act(() => {
      flushRaf();
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it("immediate=false → loop not started, fn not called after flushRaf", () => {
    const fn = vi.fn();
    renderHook(() => useRafFn(fn, { immediate: false }));

    act(() => {
      flushRaf();
    });

    expect(fn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// pause / resume
// ---------------------------------------------------------------------------

describe("pause / resume", () => {
  it("pause() stops the loop — fn not called after flush", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useRafFn(fn));

    act(() => {
      result.current.pause();
      flushRaf();
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it("resume() restarts the loop after pause", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useRafFn(fn));

    act(() => {
      result.current.pause();
    });

    act(() => {
      result.current.resume();
      flushRaf();
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it("pause() is idempotent — no error on double call", () => {
    const { result } = renderHook(() => useRafFn(vi.fn()));

    expect(() => {
      act(() => {
        result.current.pause();
        result.current.pause();
      });
    }).not.toThrow();
  });

  it("resume() is idempotent — no error on double call", () => {
    const { result } = renderHook(() => useRafFn(vi.fn(), { immediate: false }));

    expect(() => {
      act(() => {
        result.current.resume();
        result.current.resume();
      });
    }).not.toThrow();
  });

  it("pause() called inside frame callback does not queue another frame", () => {
    let pauseRef: (() => void) | undefined;
    const fn = vi.fn(() => pauseRef?.());
    const { result } = renderHook(() => {
      const controls = useRafFn(fn);
      pauseRef = controls.pause;
      return controls;
    });

    act(() => {
      flushRaf(16);
    });

    expect(fn).toHaveBeenCalledOnce();
    expect(result.current.isActive$.get()).toBe(false);
    expect(rafCallbacks.size).toBe(0);

    act(() => {
      flushRaf(32);
    });

    expect(fn).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// isActive state
// ---------------------------------------------------------------------------

describe("isActive state", () => {
  it("isActive=true after mount (immediate=true)", () => {
    const { result } = renderHook(() => useRafFn(vi.fn()));
    expect(result.current.isActive$.get()).toBe(true);
  });

  it("isActive=false after pause()", () => {
    const { result } = renderHook(() => useRafFn(vi.fn()));

    act(() => {
      result.current.pause();
    });

    expect(result.current.isActive$.get()).toBe(false);
  });

  it("isActive=true after resume()", () => {
    const { result } = renderHook(() => useRafFn(vi.fn()));

    act(() => {
      result.current.pause();
      result.current.resume();
    });

    expect(result.current.isActive$.get()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// once option
// ---------------------------------------------------------------------------

describe("once option", () => {
  it("once=true → fn called once, then isActive=false", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useRafFn(fn, { once: true }));

    act(() => {
      flushRaf(16);
    });

    expect(fn).toHaveBeenCalledOnce();
    expect(result.current.isActive$.get()).toBe(false);
  });

  it("once=true → fn not called on second flush after it ran", () => {
    const fn = vi.fn();
    renderHook(() => useRafFn(fn, { once: true }));

    act(() => {
      flushRaf(16);
    });

    act(() => {
      flushRaf(32); // nothing should be queued
    });

    expect(fn).toHaveBeenCalledOnce(); // still only once
  });
});

// ---------------------------------------------------------------------------
// delta calculation
// ---------------------------------------------------------------------------

describe("delta", () => {
  it("first frame delta is 0 (first-frame guard: lastTimestamp set to timestamp, not 0)", () => {
    let capturedDelta: number | undefined;
    renderHook(() =>
      useRafFn(({ delta }) => {
        capturedDelta = delta;
      })
    );

    act(() => {
      flushRaf(16);
    });

    expect(capturedDelta).toBe(0); // first frame: timestamp - timestamp = 0
  });

  it("consecutive frames: delta = difference between timestamps", () => {
    const deltas: number[] = [];
    renderHook(() =>
      useRafFn(({ delta }) => {
        deltas.push(delta);
      })
    );

    act(() => {
      flushRaf(16);
      flushRaf(33);
    });

    expect(deltas[0]).toBe(0); // first frame: delta = 0
    expect(deltas[1]).toBe(17); // 33 - 16
  });
});

// ---------------------------------------------------------------------------
// fpsLimit
// ---------------------------------------------------------------------------

describe("fpsLimit", () => {
  it("fpsLimit=60 → frame with delta >= 1000/60 (~16.67ms) executes fn", () => {
    const fn = vi.fn();
    renderHook(() => useRafFn(fn, { fpsLimit: 60 }));

    act(() => {
      flushRaf(17); // first frame: sets lastTimestamp=17, delta=0 → fps limit skips
      flushRaf(34); // second frame: delta=17ms >= 16.67ms — executes
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it("fpsLimit=30 → frame with delta < 1000/30 (~33ms) skips fn", () => {
    const fn = vi.fn();
    renderHook(() => useRafFn(fn, { fpsLimit: 30 }));

    act(() => {
      flushRaf(16); // delta = 16ms < 33ms — skipped
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it("fpsLimit=30 → frame with delta >= 33ms executes fn", () => {
    const fn = vi.fn();
    renderHook(() => useRafFn(fn, { fpsLimit: 30 }));

    act(() => {
      flushRaf(34); // first frame: sets lastTimestamp=34, delta=0 → fps limit skips
      flushRaf(68); // second frame: delta=34ms >= 33ms — executes
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it("fpsLimit=null (default) → every frame executes fn", () => {
    const fn = vi.fn();
    renderHook(() => useRafFn(fn)); // fpsLimit defaults to null

    act(() => {
      flushRaf(1); // tiny delta — still executes
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it("observable fpsLimit — changes apply from next frame", () => {
    const fn = vi.fn();
    const fps$ = observable<number | null>(null);
    renderHook(() => useRafFn(fn, { fpsLimit: fps$ }));

    // First frame with no limit — executes
    act(() => {
      flushRaf(16);
    });
    expect(fn).toHaveBeenCalledOnce();

    // Change to 30fps limit
    act(() => {
      fps$.set(30);
    });

    // Next frame with delta=16ms < 33ms — skipped
    act(() => {
      flushRaf(32); // 32 - 16 = 16ms delta
    });

    expect(fn).toHaveBeenCalledOnce(); // still one call
  });
});

// ---------------------------------------------------------------------------
// Unmount cleanup
// ---------------------------------------------------------------------------

describe("unmount cleanup", () => {
  it("pending rAF is cancelled on unmount — fn not called after unmount", async () => {
    const fn = vi.fn();
    const { unmount } = renderHook(() => useRafFn(fn));

    unmount();
    await flush(); // allow React effect cleanup to run

    act(() => {
      flushRaf();
    });

    expect(fn).not.toHaveBeenCalled();
    expect(rafCallbacks.size).toBe(0);
  });
});
