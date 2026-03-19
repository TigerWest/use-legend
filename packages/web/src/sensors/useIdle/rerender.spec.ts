// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { useIdle } from ".";

describe("useIdle() — rerender stability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("observable references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useIdle({ timeout: 1000 }));
    const first = result.current;
    rerender();
    expect(result.current.idle$).toBe(first.idle$);
    expect(result.current.lastActive$).toBe(first.lastActive$);
  });

  it("reset function reference is stable", () => {
    const { result, rerender } = renderHook(() => useIdle({ timeout: 1000 }));
    const firstReset = result.current.reset;
    rerender();
    expect(result.current.reset).toBe(firstReset);
  });

  it("idle state persists across re-renders", () => {
    const { result, rerender } = renderHook(() => useIdle({ timeout: 1000 }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.idle$.get()).toBe(true);

    rerender();
    expect(result.current.idle$.get()).toBe(true);
  });

  it("activity still works after re-render", () => {
    const { result, rerender } = renderHook(() => useIdle({ timeout: 1000 }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.idle$.get()).toBe(true);

    rerender();

    act(() => {
      window.dispatchEvent(new Event("mousemove"));
    });
    expect(result.current.idle$.get()).toBe(false);
  });
});
