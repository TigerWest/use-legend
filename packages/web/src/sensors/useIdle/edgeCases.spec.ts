// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIdle } from ".";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useIdle() — edge cases", () => {
  it("initialState=true starts in idle state without waiting for timeout", () => {
    const { result } = renderHook(() => useIdle({ timeout: 1000, initialState: true }));
    expect(result.current.idle$.get()).toBe(true);
  });

  it("activity event before timeout resets the timer and delays idle", () => {
    const { result } = renderHook(() => useIdle({ timeout: 1000 }));

    act(() => vi.advanceTimersByTime(800));
    expect(result.current.idle$.get()).toBe(false);

    // Fire activity — timer should reset
    act(() => window.dispatchEvent(new MouseEvent("mousemove", { bubbles: true })));

    // 800ms after the activity: still not idle (timer restarted from activity)
    act(() => vi.advanceTimersByTime(800));
    expect(result.current.idle$.get()).toBe(false);

    // Now past 1000ms since last activity → idle
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.idle$.get()).toBe(true);
  });

  it("reset() after idle state clears idle and restarts the timer", () => {
    const { result } = renderHook(() => useIdle({ timeout: 500 }));

    act(() => vi.advanceTimersByTime(600));
    expect(result.current.idle$.get()).toBe(true);

    act(() => result.current.reset());
    expect(result.current.idle$.get()).toBe(false);

    // Should not be idle again before next timeout
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.idle$.get()).toBe(false);

    // After full timeout from reset, becomes idle again
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.idle$.get()).toBe(true);
  });

  it("lastActive$ updates when activity is detected", () => {
    const before = Date.now();
    const { result } = renderHook(() => useIdle({ timeout: 5000 }));

    const initialLastActive = result.current.lastActive$.get();

    act(() => {
      vi.setSystemTime(before + 2000);
      window.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    });

    expect(result.current.lastActive$.get()).toBeGreaterThan(initialLastActive);
  });

  it("custom events: non-listed events do not reset the timer", () => {
    const { result } = renderHook(() => useIdle({ timeout: 1000, events: ["click"] }));

    act(() => vi.advanceTimersByTime(800));

    // mousemove is NOT in the custom events list → should not reset
    act(() => window.dispatchEvent(new MouseEvent("mousemove", { bubbles: true })));

    // Timer was not reset, so after 200ms more (1000ms total) → idle
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.idle$.get()).toBe(true);
  });

  it("multiple rapid activity events keep timer alive", () => {
    const { result } = renderHook(() => useIdle({ timeout: 1000 }));

    // Fire 3 activity events spread across time
    act(() => vi.advanceTimersByTime(300));
    act(() => window.dispatchEvent(new Event("keydown")));

    act(() => vi.advanceTimersByTime(300));
    act(() => window.dispatchEvent(new Event("keydown")));

    act(() => vi.advanceTimersByTime(300));
    act(() => window.dispatchEvent(new Event("keydown")));

    // Only 300ms have passed since last activity — should not be idle
    act(() => vi.advanceTimersByTime(600));
    expect(result.current.idle$.get()).toBe(false);

    // Now 1000ms since last activity → idle
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.idle$.get()).toBe(true);
  });
});
