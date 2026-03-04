// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useThrottleFn } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// basic throttle
// ---------------------------------------------------------------------------

describe("useThrottleFn()", () => {
  describe("basic throttle", () => {
    it("fires immediately on first call (leading edge)", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottleFn(fn, 300));

      act(() => {
        result.current();
      });

      // Default edges include "leading" — fn fires immediately
      expect(fn).toHaveBeenCalledOnce();
    });

    it("limits execution to once per interval with rapid calls", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottleFn(fn, 300));

      act(() => {
        result.current(); // fires immediately (leading)
        result.current(); // suppressed
        result.current(); // suppressed
      });

      // Only leading call fires synchronously
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("fires trailing call after interval when called during window", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottleFn(fn, 300));

      act(() => {
        result.current(); // leading fires
        result.current(); // queued for trailing
      });

      expect(fn).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Default edges: ["leading", "trailing"] — trailing fires after interval
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("uses default 200ms when ms not provided", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottleFn(fn));

      act(() => {
        result.current(); // leading fires
        result.current(); // queued for trailing
      });

      expect(fn).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(199);
      });

      expect(fn).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(1);
      });

      // trailing fires at 200ms
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("returns a promise that resolves with the function result", async () => {
      const fn = vi.fn().mockReturnValue("hello");
      const { result } = renderHook(() => useThrottleFn(fn, 100));

      let promise: Promise<string>;
      act(() => {
        promise = result.current() as Promise<string>;
      });

      await expect(promise!).resolves.toBe("hello");
    });
  });

  // ---------------------------------------------------------------------------
  // options
  // ---------------------------------------------------------------------------

  describe("options", () => {
    it("edges: ['leading'] — fires only on leading edge", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottleFn(fn, 300, { edges: ["leading"] }));

      act(() => {
        result.current(); // leading fires
        result.current(); // suppressed
        result.current(); // suppressed
      });

      expect(fn).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // No trailing — still 1 call
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("edges: ['trailing'] — fires only after interval ends", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottleFn(fn, 300, { edges: ["trailing"] }));

      act(() => {
        result.current(); // no leading fire
        result.current();
      });

      // No leading — 0 calls
      expect(fn).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Trailing fires after interval
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("edges: ['leading', 'trailing'] — fires on both edges", () => {
      const fn = vi.fn();
      const { result } = renderHook(() =>
        useThrottleFn(fn, 300, { edges: ["leading", "trailing"] })
      );

      act(() => {
        result.current(); // leading fires
        result.current(); // queued for trailing
      });

      expect(fn).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Both edges: leading + trailing
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // reactive ms (MaybeObservable)
  // ---------------------------------------------------------------------------

  describe("reactive ms (MaybeObservable)", () => {
    it("plain number ms — works as standard throttle", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottleFn(fn, 150));

      // First call: fires immediately (leading)
      act(() => {
        result.current();
      });

      expect(fn).toHaveBeenCalledTimes(1);

      // Second call within window — suppressed, queued for trailing
      act(() => {
        result.current();
      });

      expect(fn).toHaveBeenCalledTimes(1);

      // After window — trailing fires
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(fn).toHaveBeenCalledTimes(2);

      // New window — leading fires again
      act(() => {
        result.current();
      });

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("Observable<number> ms — throttle interval updates when observable changes", () => {
      const ms$ = observable(100);
      const fn = vi.fn();
      const { result } = renderHook(() => useThrottleFn(fn, ms$));

      // First window with ms=100
      act(() => {
        result.current(); // leading fires
      });

      expect(fn).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Update ms to 500 — next throttle window should use the new interval
      act(() => {
        ms$.set(500);
      });

      act(() => {
        result.current(); // leading fires (new window)
        result.current(); // queued for trailing
      });

      expect(fn).toHaveBeenCalledTimes(2);

      // 100ms is not enough for the new 500ms interval
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(fn).toHaveBeenCalledTimes(2); // still 2

      // Advance remaining 400ms
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(fn).toHaveBeenCalledTimes(3); // trailing fires
    });
  });

  // ---------------------------------------------------------------------------
  // unmount cleanup
  // ---------------------------------------------------------------------------

  describe("unmount cleanup", () => {
    it("pending throttle fires after unmount — no cancel-on-unmount (documents current behavior)", () => {
      const fn = vi.fn();
      const { result, unmount } = renderHook(() => useThrottleFn(fn, 300));

      act(() => {
        result.current(); // leading fires
        result.current(); // queued for trailing
      });

      expect(fn).toHaveBeenCalledTimes(1);

      unmount();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // useThrottleFn stores the throttleFilter in a ref with no lifecycle cleanup hook.
      // The pending setTimeout inside es-toolkit's throttle continues to run after unmount.
      // This documents the current behavior: trailing fn IS called even after unmount.
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
