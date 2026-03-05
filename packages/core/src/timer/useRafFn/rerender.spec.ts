// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
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
// useRafFn() — rerender stability
// ---------------------------------------------------------------------------

describe("useRafFn() — rerender stability", () => {
  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("does not restart RAF loop when unrelated state causes re-render", () => {
      const fn = vi.fn();
      const { rerender } = renderHook(() => useRafFn(fn));

      // Capture rAF id count after initial mount
      const rafCountAfterMount = rafId;

      // Re-render with the same props (simulates unrelated state update)
      rerender();

      // No new requestAnimationFrame calls should have been made beyond the initial mount
      expect(rafId).toBe(rafCountAfterMount);
    });

    it("cancelAnimationFrame is not called on re-render", () => {
      const fn = vi.fn();
      const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
      const { rerender } = renderHook(() => useRafFn(fn));

      // cancelAnimationFrame may be called during mount setup — reset count after mount
      cancelSpy.mockClear();

      rerender();

      // No extra cancelAnimationFrame calls should happen on re-render
      expect(cancelSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // callback freshness
  // -------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("callback uses latest closure after re-render", () => {
      const received: string[] = [];

      const { rerender } = renderHook(
        (props: { label: string }) =>
          useRafFn(() => {
            received.push(props.label);
          }),
        { initialProps: { label: "before" } }
      );

      // Re-render with a new label value before the first frame fires
      rerender({ label: "after" });

      act(() => {
        flushRaf(16);
      });

      // The callback should use the latest closure ("after"), not the stale one ("before")
      expect(received).toEqual(["after"]);
    });
  });

  // -------------------------------------------------------------------------
  // state preservation
  // -------------------------------------------------------------------------

  describe("state preservation", () => {
    it("isActive$ remains true during re-render (loop not interrupted)", () => {
      const fn = vi.fn();
      const { result, rerender } = renderHook(() => useRafFn(fn));

      expect(result.current.isActive$.get()).toBe(true);

      rerender();

      // isActive$ must still be true after re-render — loop was not interrupted
      expect(result.current.isActive$.get()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("delta calculation is not affected by re-render timing", () => {
      const deltas: number[] = [];
      const { rerender } = renderHook(() =>
        useRafFn(({ delta }) => {
          deltas.push(delta);
        })
      );

      act(() => {
        flushRaf(16); // first frame: delta = 0
      });

      // Re-render between frames
      rerender();

      act(() => {
        flushRaf(33); // second frame: delta = 33 - 16 = 17ms
      });

      expect(deltas[0]).toBe(0);
      expect(deltas[1]).toBe(17);
    });
  });
});
