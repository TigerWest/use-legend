// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useNow } from ".";

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
// useNow() — rerender stability
// ---------------------------------------------------------------------------

describe("useNow() — rerender stability", () => {
  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("does not restart timer when unrelated state causes re-render", () => {
      const rafSpy = vi.fn();
      vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
        rafCallbacks.set(++rafId, cb);
        rafSpy(cb);
        return rafId;
      });

      const { rerender } = renderHook(() => useNow());

      // rAF is registered once on mount — record initial call count
      const callsAfterMount = rafSpy.mock.calls.length;

      // Trigger re-render with the same props
      rerender();
      rerender();

      // No extra rAF registrations should be triggered by re-renders themselves
      const additionalCalls = rafSpy.mock.calls.length - callsAfterMount;
      expect(additionalCalls).toBe(0);

      // Flush one tick to confirm the loop is still running normally
      act(() => {
        flushRaf(16);
      });

      // After one flush, exactly one pending rAF (the loop continuation)
      expect(rafCallbacks.size).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("now$ continues updating correctly after re-render", () => {
      const { result, rerender } = renderHook(() => useNow());

      // Tick once before re-render
      act(() => {
        flushRaf(16);
      });
      const valueBeforeRerender = result.current.get().getTime();

      // Trigger re-render
      rerender();

      // Tick once after re-render
      act(() => {
        flushRaf(32);
      });
      const valueAfterRerender = result.current.get().getTime();

      // now$ must have been updated by the tick after re-render
      expect(valueAfterRerender).toBeGreaterThanOrEqual(valueBeforeRerender);
      expect(result.current.get()).toBeInstanceOf(Date);
    });
  });

  // -------------------------------------------------------------------------
  // state preservation
  // -------------------------------------------------------------------------

  describe("state preservation", () => {
    it("isActive$ remains true during re-render", () => {
      const { result, rerender } = renderHook(() => useNow({ controls: true }));

      // Confirm active on mount
      expect(result.current.isActive$.get()).toBe(true);

      // Trigger re-render
      rerender();

      // isActive$ must still be true — timer was not stopped by re-render
      expect(result.current.isActive$.get()).toBe(true);
    });
  });
});
