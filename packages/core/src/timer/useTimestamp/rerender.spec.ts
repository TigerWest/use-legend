// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimestamp } from ".";

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

describe("useTimestamp() — rerender stability", () => {
  describe("resource stability", () => {
    it("does not restart timer when unrelated state causes re-render", () => {
      const { rerender } = renderHook(() => useTimestamp());

      // Capture rAF id count after initial mount — the hook registers one rAF frame
      const rafCountAfterMount = rafId;

      // Re-render with the same props (simulates unrelated state update)
      rerender();

      // No new requestAnimationFrame calls should have been made beyond the initial mount
      expect(rafId).toBe(rafCountAfterMount);
    });
  });

  describe("value accuracy", () => {
    it("timestamp$ continues updating correctly after re-render", () => {
      const { result, rerender } = renderHook(() => useTimestamp());

      // Flush a tick to get an updated value
      act(() => {
        flushRaf(16);
      });
      const valueBeforeRerender = result.current.get();

      // Trigger re-render
      rerender();

      // Flush another tick after re-render
      act(() => {
        flushRaf(32);
      });
      const valueAfterRerender = result.current.get();

      // Value should have updated after the tick post-rerender
      expect(valueAfterRerender).toBeGreaterThanOrEqual(valueBeforeRerender);
      expect(typeof valueAfterRerender).toBe("number");
    });

    it("offset is still applied correctly after re-render", () => {
      const offset = 5000;
      const { result, rerender } = renderHook(() => useTimestamp({ offset }));

      // Trigger re-render with the same offset
      rerender();

      // Flush a tick after re-render
      const before = Date.now();
      act(() => {
        flushRaf(16);
      });
      const after = Date.now();

      const ts = result.current.get();
      expect(ts).toBeGreaterThanOrEqual(before + offset);
      expect(ts).toBeLessThanOrEqual(after + offset);
    });
  });
});
