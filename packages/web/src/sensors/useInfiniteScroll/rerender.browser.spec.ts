/**
 * useInfiniteScroll - Browser Mode Spec (Rerender Stability)
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests that hook output remains stable across React re-renders.
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useInfiniteScroll } from ".";
import type { MaybeEventTarget } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) =>
  observable<OpaqueObject<Element> | null>(
    ObservableHint.opaque(el)
  ) as unknown as MaybeEventTarget<Element>;

function makeScrollContainer(
  opts: {
    containerHeight?: number;
    contentHeight?: number;
    containerWidth?: number;
    contentWidth?: number;
  } = {}
): { container: HTMLDivElement; content: HTMLDivElement } {
  const {
    containerHeight = 200,
    contentHeight = 800,
    containerWidth = 200,
    contentWidth = 200,
  } = opts;

  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "absolute",
    left: "0px",
    top: "0px",
    width: `${containerWidth}px`,
    height: `${containerHeight}px`,
    overflow: "auto",
  });

  const content = document.createElement("div");
  Object.assign(content.style, {
    width: `${contentWidth}px`,
    height: `${contentHeight}px`,
  });

  container.appendChild(content);
  document.body.appendChild(container);

  return { container, content };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let cleanupFns: (() => void)[] = [];

beforeEach(() => {
  cleanupFns = [];
  document.body.style.margin = "0";
  document.body.style.padding = "0";
});

afterEach(() => {
  for (const fn of cleanupFns) fn();
  cleanupFns = [];
  document.body.style.margin = "";
  document.body.style.padding = "";
});

// ---------------------------------------------------------------------------
// useInfiniteScroll — rerender stability (real browser)
// ---------------------------------------------------------------------------

describe("useInfiniteScroll() — rerender stability (real browser)", () => {
  it("load/reset function identity is stable across re-renders", () => {
    const { container } = makeScrollContainer();
    cleanupFns.push(() => document.body.removeChild(container));

    const onLoadMore = vi.fn();

    const { result, rerender } = renderHook(
      ({ elObs, cb }: { elObs: ReturnType<typeof wrapEl>; cb: () => void }) =>
        useInfiniteScroll(elObs, cb, { immediate: false }),
      { initialProps: { elObs: wrapEl(container), cb: onLoadMore } }
    );

    const loadBefore = result.current.load;
    const resetBefore = result.current.reset;

    rerender({ elObs: wrapEl(container), cb: vi.fn() });
    rerender({ elObs: wrapEl(container), cb: vi.fn() });

    expect(result.current.load).toBe(loadBefore);
    expect(result.current.reset).toBe(resetBefore);
  });

  it("isLoading$ remains accurate after re-render", async () => {
    const { container } = makeScrollContainer();
    cleanupFns.push(() => document.body.removeChild(container));

    let resolveLoad!: () => void;
    const onLoadMore = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        })
    );

    const { result, rerender } = renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        direction: "bottom",
        interval: 0,
      })
    );

    // Trigger load via scroll (so visibility is handled by useObserve)
    act(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await waitFor(() => expect(result.current.isLoading$.get()).toBe(true), {
      timeout: 2000,
    });

    // Re-render while loading is in progress
    rerender();

    // isLoading$ should still be true after re-render
    expect(result.current.isLoading$.get()).toBe(true);

    // Resolve the load
    await act(async () => {
      resolveLoad();
    });

    await waitFor(() => expect(result.current.isLoading$.get()).toBe(false), {
      timeout: 2000,
    });
  });

  it("does not duplicate onLoadMore calls on re-render", async () => {
    const { container } = makeScrollContainer();
    cleanupFns.push(() => document.body.removeChild(container));

    const onLoadMore = vi.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        immediate: false,
        interval: 0,
      })
    );

    // Wait for visibility, then trigger one load
    await new Promise<void>((r) => setTimeout(r, 100));

    await act(async () => {
      await result.current.load();
    });

    const callsAfterFirstLoad = onLoadMore.mock.calls.length;

    // Re-render should not trigger additional calls
    rerender();
    rerender();

    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    expect(onLoadMore.mock.calls.length).toBe(callsAfterFirstLoad);
  });

  it("uses latest onLoadMore callback after re-render", async () => {
    const { container } = makeScrollContainer();
    cleanupFns.push(() => document.body.removeChild(container));

    const firstFn = vi.fn().mockResolvedValue(undefined);
    const secondFn = vi.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ onLoadMore }: { onLoadMore: () => Promise<void> }) =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          immediate: false,
          interval: 0,
        }),
      { initialProps: { onLoadMore: firstFn } }
    );

    rerender({ onLoadMore: secondFn });

    // Wait for visibility so load() doesn't bail on isVisible$.peek()
    await new Promise<void>((r) => setTimeout(r, 100));

    // Manually trigger load — should use the latest callback
    await act(async () => {
      await result.current.load();
    });

    expect(firstFn).not.toHaveBeenCalled();
    expect(secondFn).toHaveBeenCalledOnce();
  });
});
