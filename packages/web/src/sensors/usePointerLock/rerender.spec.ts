// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePointerLock } from ".";

describe("usePointerLock() — rerender stability", () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement("div");
    mockElement.requestPointerLock = vi.fn();
    Object.defineProperty(document, "pointerLockElement", {
      value: null,
      writable: true,
      configurable: true,
    });
    document.exitPointerLock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (document as any).pointerLockElement;
  });

  it("observable references are stable across re-renders", () => {
    const { result, rerender } = renderHook(() => usePointerLock());
    const first = result.current;
    rerender();
    expect(result.current.isSupported$).toBe(first.isSupported$);
    expect(result.current.element$).toBe(first.element$);
  });

  it("lock/unlock function references are stable", () => {
    const { result, rerender } = renderHook(() => usePointerLock());
    const firstLock = result.current.lock;
    const firstUnlock = result.current.unlock;
    rerender();
    expect(result.current.lock).toBe(firstLock);
    expect(result.current.unlock).toBe(firstUnlock);
  });

  it("element$ value persists across re-renders", () => {
    const { result, rerender } = renderHook(() => usePointerLock());

    act(() => {
      result.current.lock(mockElement);
    });
    act(() => {
      (document as any).pointerLockElement = mockElement;
      document.dispatchEvent(new Event("pointerlockchange"));
    });

    expect(result.current.element$.get()).toBe(mockElement);
    rerender();
    expect(result.current.element$.get()).toBe(mockElement);
  });

  it("does not re-register event listeners on re-render", () => {
    const addSpy = vi.spyOn(document, "addEventListener");

    const { rerender } = renderHook(() => usePointerLock());
    const countAfterMount = addSpy.mock.calls.filter(
      ([type]) => typeof type === "string" && type.startsWith("pointerlock")
    ).length;

    rerender();
    rerender();

    const countAfterRerenders = addSpy.mock.calls.filter(
      ([type]) => typeof type === "string" && type.startsWith("pointerlock")
    ).length;

    expect(countAfterRerenders).toBe(countAfterMount);
  });
});
