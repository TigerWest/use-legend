// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useThrottled } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useThrottled() — edge cases", () => {
  it("ms=0 — updates synchronously without delay", () => {
    const source$ = observable("initial");

    const { result } = renderHook(() => useThrottled(source$, { ms: 0 }));

    act(() => {
      source$.set("immediate");
    });

    expect(result.current.get()).toBe("immediate");
  });

  it("source changes to same value — throttled$ remains stable", () => {
    const source$ = observable("hello");

    const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

    // Wait for initial throttle window to pass
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.get()).toBe("hello");

    const changeCount = { value: 0 };
    result.current.onChange(() => {
      changeCount.value += 1;
    });

    // Set source to the same value
    act(() => {
      source$.set("hello");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // throttled$ must not have fired an unnecessary notification
    expect(result.current.get()).toBe("hello");
    expect(changeCount.value).toBe(0);
  });

  it("rapid source changes — leading captures first, trailing captures last", () => {
    const source$ = observable("initial");

    const { result } = renderHook(() => useThrottled(source$, { ms: 300 }));

    // Expire initial window
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Rapid changes within one throttle window
    act(() => {
      source$.set("a"); // leading fires with "a"
    });

    expect(result.current.get()).toBe("a");

    act(() => {
      source$.set("b");
      source$.set("c");
      source$.set("d");
    });

    // Still "a" during window
    expect(result.current.get()).toBe("a");

    // After window — trailing fires with last value
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.get()).toBe("d");
  });
});
