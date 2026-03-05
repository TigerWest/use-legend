// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useRafFn } from ".";

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
// useRafFn() — reactive options
// ---------------------------------------------------------------------------

describe("useRafFn() — reactive options", () => {
  // -------------------------------------------------------------------------
  // Observable option change
  // -------------------------------------------------------------------------

  describe("Observable option change", () => {
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

      // Next frame with delta=16ms < 33ms — skipped due to new fpsLimit
      act(() => {
        flushRaf(32); // 32 - 16 = 16ms delta
      });

      expect(fn).toHaveBeenCalledOnce(); // still one call

      // Frame with sufficient delta — executes
      act(() => {
        flushRaf(66); // 66 - 16 = 50ms delta >= 33ms
      });

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("observable fpsLimit — removing limit (set to null) allows every frame to execute", () => {
      const fn = vi.fn();
      const fps$ = observable<number | null>(30);
      renderHook(() => useRafFn(fn, { fpsLimit: fps$ }));

      // First frame — skipped (delta=0 on first frame, fps limit active)
      act(() => {
        flushRaf(16);
      });
      expect(fn).not.toHaveBeenCalled();

      // Remove fpsLimit
      act(() => {
        fps$.set(null);
      });

      // Next frame — no limit, tiny delta still executes
      act(() => {
        flushRaf(17);
      });

      expect(fn).toHaveBeenCalledOnce();
    });
  });
});
