// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable } from "@legendapp/state";
import { describe, it, expect } from "vitest";
import { useDataHistory } from ".";

describe("useDataHistory() — rerender stability", () => {
  it("auto-tracking continues across re-renders", () => {
    const source$ = observable(0);
    const { result, rerender } = renderHook(() => useDataHistory(source$));

    act(() => {
      source$.set(1);
    });

    rerender();

    act(() => {
      source$.set(2);
    });

    // Both changes should have been committed
    expect(result.current.last$.get().snapshot).toBe(2);
    expect(result.current.canUndo$.get()).toBe(true);
  });

  it("does not duplicate commits on re-render", () => {
    const source$ = observable(0);
    const { result, rerender } = renderHook(() => useDataHistory(source$));

    const baselineLength = result.current.history$.get().length;

    rerender();
    rerender();
    rerender();

    // Re-renders alone must not trigger extra commits
    expect(result.current.history$.get().length).toBe(baselineLength);
  });

  it("isTracking$ reference is stable across re-renders", () => {
    const source$ = observable(0);
    const { result, rerender } = renderHook(() => useDataHistory(source$));

    const isTracking$Before = result.current.isTracking$;

    rerender();

    const isTracking$After = result.current.isTracking$;

    expect(isTracking$Before).toBe(isTracking$After);
  });

  it("pause/resume state preserved after re-render", () => {
    const source$ = observable(0);
    const { result, rerender } = renderHook(() => useDataHistory(source$));

    act(() => {
      result.current.pause();
    });

    expect(result.current.isTracking$.get()).toBe(false);

    rerender();

    // Still paused after re-render
    expect(result.current.isTracking$.get()).toBe(false);

    // Capture baseline — changes while paused should not be recorded
    const baselineLength = result.current.history$.get().length;

    act(() => {
      source$.set(1);
    });

    rerender();

    expect(result.current.history$.get().length).toBe(baselineLength);

    // Resume and verify tracking resumes
    act(() => {
      result.current.resume();
    });

    expect(result.current.isTracking$.get()).toBe(true);

    act(() => {
      source$.set(2);
    });

    expect(result.current.history$.get().length).toBe(baselineLength + 1);
    expect(result.current.last$.get().snapshot).toBe(2);
  });
});
