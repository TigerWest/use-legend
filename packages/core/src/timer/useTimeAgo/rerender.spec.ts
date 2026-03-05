// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
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
// useTimeAgo() — rerender stability
// ---------------------------------------------------------------------------

describe("useTimeAgo() — rerender stability", () => {
  // -------------------------------------------------------------------------
  // resource stability
  // -------------------------------------------------------------------------

  describe("resource stability", () => {
    it("does not restart internal timer when unrelated state causes re-render", () => {
      const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

      const from = new Date(Date.now() - 5 * 60_000);
      const { rerender } = renderHook(() => useTimeAgo(from, { updateInterval: 1000 }));

      // Record setInterval call count after mount
      const callsAfterMount = setIntervalSpy.mock.calls.length;

      // Trigger re-renders with the same props (simulate unrelated state change)
      rerender();
      rerender();

      // No additional setInterval calls should result from re-renders alone
      const additionalCalls = setIntervalSpy.mock.calls.length - callsAfterMount;
      expect(additionalCalls).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // value accuracy
  // -------------------------------------------------------------------------

  describe("value accuracy", () => {
    it("timeAgo$ value remains accurate after re-render", () => {
      const from = new Date(Date.now() - 5 * 60_000); // 5 min ago
      const { result, rerender } = renderHook(() => useTimeAgo(from));

      const valueBeforeRerender = result.current.get();
      expect(valueBeforeRerender).toBe("5 minutes ago");

      // Trigger re-render
      rerender();

      // Value should remain the same immediately after re-render (no timer tick)
      expect(result.current.get()).toBe("5 minutes ago");
    });
  });

  // -------------------------------------------------------------------------
  // callback freshness
  // -------------------------------------------------------------------------

  describe("callback freshness", () => {
    it("custom messages/formatter still works correctly after re-render", () => {
      const from = new Date(Date.now() - 5 * 60_000); // 5 min ago

      // Use max option with a custom fullDateFormatter
      const { result, rerender } = renderHook(
        (props: { formatter: (d: Date) => string }) =>
          useTimeAgo(from, {
            max: "year",
            fullDateFormatter: props.formatter,
          }),
        {
          initialProps: {
            formatter: (d: Date) => `v1:${d.toISOString().slice(0, 10)}`,
          },
        }
      );

      // Before re-render: time is within 'year' max, so timeAgo format is used
      expect(result.current.get()).toBe("5 minutes ago");

      // Re-render with a new formatter reference
      rerender({
        formatter: (d: Date) => `v2:${d.toISOString().slice(0, 10)}`,
      });

      // Value should still be formatted correctly (not throw or break)
      expect(result.current.get()).toBe("5 minutes ago");
    });
  });
});
