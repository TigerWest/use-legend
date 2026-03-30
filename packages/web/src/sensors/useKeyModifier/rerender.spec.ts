// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useKeyModifier } from ".";

describe("useKeyModifier() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("observable reference is stable across re-renders", () => {
    const { result, rerender } = renderHook(() => useKeyModifier("Shift"));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("state persists across re-renders", () => {
    const { result, rerender } = renderHook(() => useKeyModifier("Shift"));

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Shift" });
      Object.defineProperty(event, "getModifierState", {
        value: () => true,
      });
      window.dispatchEvent(event);
    });
    expect(result.current.get()).toBe(true);

    rerender();
    expect(result.current.get()).toBe(true);
  });

  it("events still work after re-render", () => {
    const { result, rerender } = renderHook(() => useKeyModifier("Shift"));

    rerender();

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Shift" });
      Object.defineProperty(event, "getModifierState", {
        value: () => true,
      });
      window.dispatchEvent(event);
    });
    expect(result.current.get()).toBe(true);
  });

  it("does not re-register listeners on re-render", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { rerender } = renderHook(() => useKeyModifier("Shift"));
    const callsAfterMount = addSpy.mock.calls.length;
    rerender();
    rerender();
    expect(addSpy.mock.calls.length).toBe(callsAfterMount);
  });
});
