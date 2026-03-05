// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCountdown } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useCountdown() — reactive options
// ---------------------------------------------------------------------------

describe("useCountdown() — reactive options", () => {
  // -------------------------------------------------------------------------
  // Observable option change
  // -------------------------------------------------------------------------

  describe("Observable option change", () => {
    it("reset() reads current Observable value after initialCount Observable changes", () => {
      const count$ = observable(10);
      const { result } = renderHook(() => useCountdown(count$));

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.remaining$.get()).toBe(7);

      // Change the Observable source
      count$.set(20);

      act(() => {
        result.current.reset();
      });
      expect(result.current.remaining$.get()).toBe(20);
    });
  });
});
