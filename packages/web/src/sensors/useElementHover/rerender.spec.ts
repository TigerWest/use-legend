// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useElementHover } from ".";

describe("useElementHover() — rerender stability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("observable reference is stable across re-renders", () => {
    const el = document.createElement("div");
    const { result, rerender } = renderHook(() => useElementHover(el));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("hover state persists across re-renders", () => {
    const el = document.createElement("div");
    const { result, rerender } = renderHook(() => useElementHover(el));

    act(() => {
      el.dispatchEvent(new Event("mouseenter"));
    });
    expect(result.current.get()).toBe(true);

    rerender();
    expect(result.current.get()).toBe(true);
  });

  it("hover events still work after re-render", () => {
    const el = document.createElement("div");
    const { result, rerender } = renderHook(() => useElementHover(el));

    rerender();

    act(() => {
      el.dispatchEvent(new Event("mouseenter"));
    });
    expect(result.current.get()).toBe(true);

    act(() => {
      el.dispatchEvent(new Event("mouseleave"));
    });
    expect(result.current.get()).toBe(false);
  });

  it("does not re-register listeners on re-render", () => {
    const el = document.createElement("div");
    const addSpy = vi.spyOn(el, "addEventListener");
    const { rerender } = renderHook(() => useElementHover(el));
    const callsAfterMount = addSpy.mock.calls.length;
    rerender();
    rerender();
    expect(addSpy.mock.calls.length).toBe(callsAfterMount);
  });
});
