// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useInfiniteScroll } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

function makeEl(
  overrides: Partial<{
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
  }> = {}
): HTMLDivElement {
  const el = document.createElement("div");
  const {
    scrollWidth = 500,
    scrollHeight = 1000,
    clientWidth = 300,
    clientHeight = 400,
    scrollTop = 0,
    scrollLeft = 0,
  } = overrides;
  Object.defineProperties(el, {
    scrollLeft: { writable: true, configurable: true, value: scrollLeft },
    scrollTop: { writable: true, configurable: true, value: scrollTop },
    scrollWidth: { writable: true, configurable: true, value: scrollWidth },
    scrollHeight: { writable: true, configurable: true, value: scrollHeight },
    clientWidth: { writable: true, configurable: true, value: clientWidth },
    clientHeight: { writable: true, configurable: true, value: clientHeight },
  });
  return el;
}

// ---------------------------------------------------------------------------
// useInfiniteScroll — rerender stability
// ---------------------------------------------------------------------------

describe("useInfiniteScroll() — rerender stability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("load/reset function identity is stable across re-renders", () => {
    const el = makeEl();
    const onLoadMore = vi.fn();

    const { result, rerender } = renderHook(
      ({ elObs, cb }: { elObs: ReturnType<typeof wrapEl>; cb: () => void }) =>
        useInfiniteScroll(elObs, cb),
      { initialProps: { elObs: wrapEl(el), cb: onLoadMore } }
    );

    const loadBefore = result.current.load;
    const resetBefore = result.current.reset;

    rerender({ elObs: wrapEl(el), cb: vi.fn() });
    rerender({ elObs: wrapEl(el), cb: vi.fn() });

    expect(result.current.load).toBe(loadBefore);
    expect(result.current.reset).toBe(resetBefore);
  });

  it("isLoading$ remains accurate after re-render", async () => {
    const el = makeEl();
    let resolveLoad!: () => void;
    const onLoadMore = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        })
    );

    const { result, rerender } = renderHook(() =>
      useInfiniteScroll(wrapEl(el), onLoadMore, { immediate: false })
    );

    // Trigger a manual load
    act(() => {
      void result.current.load();
    });

    expect(result.current.isLoading$.get()).toBe(true);

    // Re-render while loading is in progress
    rerender();

    // isLoading$ should still be true after re-render
    expect(result.current.isLoading$.get()).toBe(true);

    // Resolve the load
    await act(async () => {
      resolveLoad();
    });

    expect(result.current.isLoading$.get()).toBe(false);
  });

  it("does not duplicate onLoadMore calls on re-render", async () => {
    const el = makeEl();
    const onLoadMore = vi.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(() =>
      useInfiniteScroll(wrapEl(el), onLoadMore, { immediate: false })
    );

    // Trigger one load
    await act(async () => {
      await result.current.load();
    });

    const callsAfterFirstLoad = onLoadMore.mock.calls.length;

    // Re-render should not trigger additional calls
    rerender();
    rerender();

    expect(onLoadMore.mock.calls.length).toBe(callsAfterFirstLoad);
  });

  it("uses latest onLoadMore callback after re-render", async () => {
    const firstFn = vi.fn().mockResolvedValue(undefined);
    const secondFn = vi.fn().mockResolvedValue(undefined);
    const el = makeEl();

    const { result, rerender } = renderHook(
      ({ onLoadMore }: { onLoadMore: () => Promise<void> }) =>
        useInfiniteScroll(wrapEl(el), onLoadMore, { immediate: false }),
      { initialProps: { onLoadMore: firstFn } }
    );

    rerender({ onLoadMore: secondFn });

    // Manually trigger load — should use the latest callback
    await act(async () => {
      await result.current.load();
    });

    expect(firstFn).not.toHaveBeenCalled();
    expect(secondFn).toHaveBeenCalledOnce();
  });
});
