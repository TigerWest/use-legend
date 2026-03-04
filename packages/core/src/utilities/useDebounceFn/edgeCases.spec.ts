// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounceFn } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useDebounceFn() — edge cases", () => {
  it("ms=0 — executes synchronously without delay", async () => {
    const cb = vi.fn().mockReturnValue("sync-result");
    const { result } = renderHook(() => useDebounceFn(cb, 0));

    let promise: Promise<unknown>;
    act(() => {
      promise = result.current();
    });

    // debounceFilter skips the timer path when ms <= 0 and calls invoke() directly
    expect(cb).toHaveBeenCalledOnce();
    await expect(promise!).resolves.toBe("sync-result");
  });

  it("rapid sequential calls — only last call arguments are used", async () => {
    const cb = vi.fn();
    const { result } = renderHook(() => useDebounceFn(cb, 300));

    act(() => {
      result.current("a");
      result.current("b");
      result.current("c");
    });

    // No calls yet — debounce timer still pending
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Fired exactly once with the last arguments
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("c");
  });

  it("calling debounced function after unmount does not throw", () => {
    const cb = vi.fn();
    const { result, unmount } = renderHook(() => useDebounceFn(cb, 300));

    const debouncedFn = result.current;
    unmount();

    // Must not throw when called post-unmount
    expect(() => {
      debouncedFn();
    }).not.toThrow();
  });

  it("maxWait with Observable<number> — reactive maxWait", async () => {
    const maxWait$ = observable(1000);
    const cb = vi.fn();
    const { result } = renderHook(() => useDebounceFn(cb, 500, { maxWait: maxWait$ }));

    // Continuous calls every 200ms — debounce window (500ms) keeps resetting
    // but maxWait (1000ms) should force execution
    act(() => {
      result.current();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // 800ms elapsed — debounce hasn't fired (kept resetting), maxWait not yet reached
    expect(cb).not.toHaveBeenCalled();

    // Advance to 1000ms total — maxWait forces execution
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(cb).toHaveBeenCalledTimes(1);
  });
});
