// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMousePressed } from ".";

describe("useMousePressed() — edge cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("multiple pointerdown without pointerup does not stack", () => {
    const { result } = renderHook(() => useMousePressed());
    act(() => {
      window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });
    act(() => {
      window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });
    expect(result.current.pressed$.get()).toBe(true);
    // Single pointerup should release
    act(() => {
      window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    });
    expect(result.current.pressed$.get()).toBe(false);
  });

  it("pointerup without preceding pointerdown is no-op", () => {
    const onReleased = vi.fn();
    const { result } = renderHook(() => useMousePressed({ onReleased }));
    act(() => {
      window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    });
    expect(result.current.pressed$.get()).toBe(false);
    expect(onReleased).not.toHaveBeenCalled();
  });

  it("rapid press/release does not miss events", () => {
    const { result } = renderHook(() => useMousePressed());
    act(() => {
      for (let i = 0; i < 50; i++) {
        window.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
        window.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
      }
    });
    // After rapid press/release cycles, should be released
    expect(result.current.pressed$.get()).toBe(false);
  });

  it("handles null target gracefully", () => {
    expect(() => {
      const { result } = renderHook(() => useMousePressed({ target: null as any }));
      expect(result.current.pressed$.get()).toBe(false);
      expect(result.current.sourceType$.get()).toBeNull();
    }).not.toThrow();
  });
});
