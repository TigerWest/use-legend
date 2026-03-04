// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounceFn } from ".";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// basic debounce
// ---------------------------------------------------------------------------

describe("useDebounceFn()", () => {
  describe("basic debounce", () => {
    it("delays function execution by specified ms", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounceFn(fn, 300));

      act(() => {
        result.current();
      });

      expect(fn).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(fn).toHaveBeenCalledOnce();
    });

    it("only executes once when called multiple times within delay", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounceFn(fn, 300));

      act(() => {
        result.current();
        result.current();
        result.current();
      });

      expect(fn).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(fn).toHaveBeenCalledOnce();
    });

    it("uses default 200ms when ms not provided", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounceFn(fn));

      act(() => {
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(199);
      });

      expect(fn).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(fn).toHaveBeenCalledOnce();
    });

    it("returns a promise that resolves with the function result", async () => {
      const fn = vi.fn().mockReturnValue("hello");
      const { result } = renderHook(() => useDebounceFn(fn, 100));

      let promise: Promise<string>;
      act(() => {
        promise = result.current() as Promise<string>;
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      await expect(promise!).resolves.toBe("hello");
    });
  });

  // ---------------------------------------------------------------------------
  // options
  // ---------------------------------------------------------------------------

  describe("options", () => {
    it("edges: ['leading'] — fires immediately on first call", async () => {
      const fn = vi.fn().mockReturnValue("lead");
      const { result } = renderHook(() => useDebounceFn(fn, 100, { edges: ["leading"] }));

      let promise: Promise<string>;
      act(() => {
        promise = result.current() as Promise<string>;
      });

      // leading: fn fires immediately, before timer
      expect(fn).toHaveBeenCalledOnce();
      await expect(promise!).resolves.toBe("lead");

      // subsequent rapid calls within window are suppressed (trailing disabled)
      act(() => {
        result.current();
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(fn).toHaveBeenCalledOnce();
    });

    it("edges: ['leading', 'trailing'] — fires on both edges", async () => {
      const fn = vi.fn().mockReturnValue("both");
      const { result } = renderHook(() =>
        useDebounceFn(fn, 100, { edges: ["leading", "trailing"] })
      );

      // leading fires immediately
      act(() => {
        result.current();
      });

      expect(fn).toHaveBeenCalledTimes(1);

      // rapid calls within window
      act(() => {
        result.current();
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // trailing fires after delay
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("maxWait — forces execution after maxWait ms even with continuous calls", async () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounceFn(fn, 300, { maxWait: 500 }));

      // keep calling every 100ms — debounce keeps resetting, but maxWait caps it
      act(() => {
        result.current();
        vi.advanceTimersByTime(100);
      });
      act(() => {
        result.current();
        vi.advanceTimersByTime(100);
      });
      act(() => {
        result.current();
        vi.advanceTimersByTime(100);
      });

      // 300ms elapsed, debounce not yet fired (kept resetting), maxWait (500ms) not yet
      expect(fn).not.toHaveBeenCalled();

      // advance to 500ms total — maxWait forces execution
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(fn).toHaveBeenCalledOnce();
    });
  });

  // ---------------------------------------------------------------------------
  // reactive ms (MaybeObservable)
  // ---------------------------------------------------------------------------

  describe("reactive ms (MaybeObservable)", () => {
    it("plain number ms — works as standard debounce", () => {
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounceFn(fn, 150));

      act(() => {
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(149);
      });

      expect(fn).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(fn).toHaveBeenCalledOnce();
    });

    it("Observable<number> ms — debounce delay updates when observable changes", async () => {
      const ms$ = observable(100);
      const fn = vi.fn();
      const { result } = renderHook(() => useDebounceFn(fn, ms$));

      // first call with ms=100
      act(() => {
        result.current();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(fn).toHaveBeenCalledTimes(1);

      // update ms to 300 — next call should use the new delay
      act(() => {
        ms$.set(300);
      });

      act(() => {
        result.current();
      });

      // 100ms is not enough for the new 300ms delay
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(fn).toHaveBeenCalledTimes(1); // still 1 — needs 300ms

      // advance remaining 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // unmount cleanup
  // ---------------------------------------------------------------------------

  describe("unmount cleanup", () => {
    it("pending debounce fires after unmount — no cancel-on-unmount (documents current behavior)", async () => {
      const fn = vi.fn();
      const { result, unmount } = renderHook(() => useDebounceFn(fn, 300));

      act(() => {
        result.current();
      });

      expect(fn).not.toHaveBeenCalled();

      unmount();
      await flush(); // allow React effect cleanup to run

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // useDebounceFn stores the debounceFilter in a ref with no lifecycle cleanup hook.
      // The pending setTimeout inside es-toolkit's debounce continues to run after unmount.
      // This documents the current behavior: fn IS called even after unmount.
      // If explicit cancel-on-unmount is added in future, this expectation should change to 0.
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
