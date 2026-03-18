// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { observable } from "@legendapp/state";
import { useElementHover } from ".";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useElementHover() — reactive options", () => {
  describe("Observable option change", () => {
    it("delayEnter change takes effect on next mouseenter", async () => {
      vi.useFakeTimers();

      const el = document.createElement("div");
      const delayEnter$ = observable(100);

      const { result } = renderHook(() => useElementHover(el, { delayEnter: delayEnter$ }));

      // First mouseenter — delayEnter is 100ms
      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(false);

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.get()).toBe(true);

      // Reset hover state via mouseleave
      act(() => {
        el.dispatchEvent(new Event("mouseleave"));
      });
      expect(result.current.get()).toBe(false);

      // Change delayEnter to 200ms
      act(() => {
        delayEnter$.set(200);
      });

      // Second mouseenter — delayEnter is now 200ms
      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });

      // After 100ms — should still be false (new delay is 200ms)
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.get()).toBe(false);

      // After another 100ms (total 200ms) — should now be true
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.get()).toBe(true);
    });
  });

  describe("per-field Observable", () => {
    it("per-field delayLeave$ change reflects immediately", async () => {
      vi.useFakeTimers();

      const el = document.createElement("div");
      const delayLeave$ = observable(100);

      const { result } = renderHook(() => useElementHover(el, { delayLeave: delayLeave$ }));

      // Enter hover state immediately (no delayEnter)
      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(true);

      // Mouseleave — delayLeave is 100ms
      act(() => {
        el.dispatchEvent(new Event("mouseleave"));
      });
      expect(result.current.get()).toBe(true); // still true during delay

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.get()).toBe(false);

      // Re-enter hover state
      act(() => {
        el.dispatchEvent(new Event("mouseenter"));
      });
      expect(result.current.get()).toBe(true);

      // Change delayLeave$ to 0 — next mouseleave should be instant
      act(() => {
        delayLeave$.set(0);
      });

      // Mouseleave — now with delayLeave = 0, should be instant
      act(() => {
        el.dispatchEvent(new Event("mouseleave"));
      });
      expect(result.current.get()).toBe(false);
    });
  });
});
