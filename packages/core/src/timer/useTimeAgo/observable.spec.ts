// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimeAgo } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useTimeAgo() — reactive options
// ---------------------------------------------------------------------------

describe("useTimeAgo() — reactive options", () => {
  // -------------------------------------------------------------------------
  // Observable option change
  // -------------------------------------------------------------------------

  describe("Observable option change", () => {
    it("updates when time Observable changes", () => {
      const time$ = observable(new Date(Date.now() - 5 * 60_000));
      const { result } = renderHook(() => useTimeAgo(time$));

      expect(result.current.get()).toBe("5 minutes ago");

      act(() => {
        time$.set(new Date(Date.now() - 2 * 60_000));
      });

      expect(result.current.get()).toBe("2 minutes ago");
    });

    it("updates when Observable time switches from past to future", () => {
      const time$ = observable(new Date(Date.now() - 5 * 60_000));
      const { result } = renderHook(() => useTimeAgo(time$));

      expect(result.current.get()).toBe("5 minutes ago");

      act(() => {
        time$.set(new Date(Date.now() + 5 * 60_000));
      });

      expect(result.current.get()).toBe("in 5 minutes");
    });
  });
});
