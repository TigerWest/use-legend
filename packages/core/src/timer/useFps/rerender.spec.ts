// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useFps } from ".";

// ---------------------------------------------------------------------------
// rAF mock helpers
// ---------------------------------------------------------------------------

let rafCallbacks: Map<number, FrameRequestCallback>;
let rafId: number;
let rafCallCount: number;

const flushRaf = (timestamp = 16) => {
  const cbs = [...rafCallbacks.values()];
  rafCallbacks.clear();
  cbs.forEach((cb) => cb(timestamp));
};

beforeEach(() => {
  rafCallbacks = new Map();
  rafId = 0;
  rafCallCount = 0;

  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    rafCallCount += 1;
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
// useFps() — rerender stability
// ---------------------------------------------------------------------------

describe("useFps() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not restart RAF loop when unrelated state causes re-render", () => {
      const { rerender } = renderHook(() => useFps({ every: 10 }));

      // Capture RAF call count after initial mount
      const countAfterMount = rafCallCount;

      // Re-render with same props — simulates unrelated state change
      rerender();
      rerender();
      rerender();

      // RAF loop should not have been re-registered; call count must not increase
      // (each flush triggers one new RAF schedule — only the loop continuation, not a restart)
      expect(rafCallCount).toBe(countAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("fps$ value remains accurate after re-render", () => {
      const { result, rerender } = renderHook(() => useFps({ every: 5 }));

      // Accumulate 5 frames to trigger first FPS sample
      act(() => {
        for (let i = 0; i < 5; i++) {
          flushRaf(i * 16);
        }
      });

      const fpsBeforeRerender = result.current.get();
      expect(fpsBeforeRerender).toBeGreaterThan(0);

      // Trigger re-render via same props (unrelated state change simulation)
      rerender();

      // fps$ must retain the same sampled value after re-render
      expect(result.current.get()).toBe(fpsBeforeRerender);
    });
  });

  describe("state preservation", () => {
    it("tick counter is not reset by re-render", () => {
      // Use every=10 so FPS only updates after 10 cumulative ticks.
      // Flush 5 ticks, re-render, then flush 5 more ticks.
      // If ticksRef were reset by re-render, the counter would restart at 0
      // and never reach 10 across the 10-tick window, keeping fps$ at 0.
      // If ticksRef is preserved, the cumulative 10 ticks trigger sampling.
      const { result, rerender } = renderHook(() => useFps({ every: 10 }));

      // First 5 frames — not yet enough to sample (every=10)
      act(() => {
        for (let i = 0; i < 5; i++) {
          flushRaf(i * 16);
        }
      });

      expect(result.current.get()).toBe(0);

      // Re-render mid-accumulation
      rerender();

      // 5 more frames — should complete the 10-tick window
      act(() => {
        for (let i = 5; i < 10; i++) {
          flushRaf(i * 16);
        }
      });

      // If tick counter survived re-render, FPS is now calculated (> 0)
      expect(result.current.get()).toBeGreaterThan(0);
    });
  });
});
