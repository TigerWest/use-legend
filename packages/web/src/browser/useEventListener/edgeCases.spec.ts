// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useEventListener } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEventListener() — edge cases", () => {
  it("does not register when target is null", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    addSpy.mockClear();
    const listener = vi.fn();

    renderHook(() => useEventListener(null as any, "click", listener));

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("does not register when target is undefined", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    addSpy.mockClear();
    const listener = vi.fn();

    renderHook(() => useEventListener(undefined as any, "click", listener));

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("empty target array does not register any listener", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    addSpy.mockClear();
    const listener = vi.fn();

    renderHook(() => useEventListener([] as any, "click", listener));

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("duplicate targets in array are each registered once", () => {
    const div = document.createElement("div");
    const addSpy = vi.spyOn(div, "addEventListener");
    const listener = vi.fn();

    // Same element wrapped twice — each observable resolves to the same element
    renderHook(() => useEventListener([wrapEl(div), wrapEl(div)] as any, "click", listener));

    // Each occurrence in the array gets one registration
    expect(addSpy).toHaveBeenCalledTimes(2);

    // Both fire listener — but it should fire once per actual addEventListener call
    act(() => {
      div.dispatchEvent(new Event("click"));
    });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("stale closure — latest listener is always called (regression guard)", () => {
    const div = document.createElement("div");
    const staleListener = vi.fn();
    const freshListener = vi.fn();

    const { rerender } = renderHook(
      ({ listener }: { listener: (e: Event) => void }) =>
        useEventListener(div, "click", listener),
      { initialProps: { listener: staleListener } }
    );

    rerender({ listener: freshListener });

    act(() => {
      div.dispatchEvent(new Event("click"));
    });

    // Forwarder always delegates to the latest listener
    expect(staleListener).not.toHaveBeenCalled();
    expect(freshListener).toHaveBeenCalledOnce();
  });

  it("manual cleanup then unmount does not cause double removeEventListener", async () => {
    const div = document.createElement("div");
    const removeSpy = vi.spyOn(div, "removeEventListener");
    const listener = vi.fn();

    const { result, unmount } = renderHook(() => useEventListener(div, "click", listener));

    // Manual cleanup
    act(() => {
      result.current();
    });

    const removeCountAfterManual = removeSpy.mock.calls.length;

    // Unmount — should not call removeEventListener again (already cleaned up)
    unmount();
    await Promise.resolve();

    expect(removeSpy.mock.calls.length).toBe(removeCountAfterManual);
  });

  it("SVG element target is supported", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const addSpy = vi.spyOn(svg, "addEventListener");
    const listener = vi.fn();

    renderHook(() => useEventListener(svg as any, "click", listener));

    expect(addSpy).toHaveBeenCalledWith("click", expect.any(Function), undefined);

    act(() => {
      svg.dispatchEvent(new Event("click"));
    });

    expect(listener).toHaveBeenCalledOnce();
  });
});
