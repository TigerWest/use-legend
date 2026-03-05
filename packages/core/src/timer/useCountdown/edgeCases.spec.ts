// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
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
// useCountdown() — edge cases
// ---------------------------------------------------------------------------

describe("useCountdown() — edge cases", () => {
  it("initialCount=0 does not auto-start", () => {
    const { result } = renderHook(() => useCountdown(0));

    expect(result.current.remaining$.get()).toBe(0);
    expect(result.current.isActive$.get()).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Must remain 0 and never go negative
    expect(result.current.remaining$.get()).toBe(0);
    expect(result.current.isActive$.get()).toBe(false);
  });

  it("onComplete is not called multiple times", () => {
    const onComplete = vi.fn();
    renderHook(() => useCountdown(1, { onComplete }));

    // Advance well past the completion point
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // onComplete must fire exactly once even after extra ticks
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
