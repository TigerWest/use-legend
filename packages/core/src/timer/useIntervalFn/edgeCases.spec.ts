// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIntervalFn } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// useIntervalFn() — edge cases
// ---------------------------------------------------------------------------

describe("useIntervalFn() — edge cases", () => {
  it("rapid pause/resume does not create multiple intervals", () => {
    const cb = vi.fn();
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    const { result } = renderHook(() => useIntervalFn(cb, 1000));

    // capture baseline setInterval call count after mount
    const setIntervalCallsAfterMount = setIntervalSpy.mock.calls.length;

    // rapid pause/resume cycle
    act(() => {
      result.current.pause();
      result.current.resume();
      result.current.pause();
      result.current.resume();
    });

    // each resume() should create exactly one interval — 2 resumes = 2 setInterval calls
    const newSetIntervalCalls = setIntervalSpy.mock.calls.length - setIntervalCallsAfterMount;
    expect(newSetIntervalCalls).toBe(2);

    // advance one tick — cb should be called exactly once (one active interval)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(cb).toHaveBeenCalledOnce();
  });
});
