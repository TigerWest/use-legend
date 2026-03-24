// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { usePageLeave } from ".";

describe("usePageLeave() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not re-register event listeners on re-render", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { rerender } = renderHook(() => usePageLeave());
    const countBefore = addSpy.mock.calls.filter(([t]) => t === "mouseout").length;
    rerender();
    const countAfter = addSpy.mock.calls.filter(([t]) => t === "mouseout").length;
    expect(countAfter).toBe(countBefore);
  });

  it("observable reference is stable across re-renders", () => {
    const { result, rerender } = renderHook(() => usePageLeave());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("state persists across re-renders", () => {
    const { result, rerender } = renderHook(() => usePageLeave());

    act(() => {
      const event = new MouseEvent("mouseout", { relatedTarget: null });
      window.dispatchEvent(event);
    });
    expect(result.current.get()).toBe(true);

    rerender();
    expect(result.current.get()).toBe(true);
  });

  it("events still work after re-render", () => {
    const { result, rerender } = renderHook(() => usePageLeave());
    rerender();

    act(() => {
      const event = new MouseEvent("mouseout", { relatedTarget: null });
      window.dispatchEvent(event);
    });
    expect(result.current.get()).toBe(true);
  });
});
