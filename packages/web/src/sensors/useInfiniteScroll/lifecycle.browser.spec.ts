/**
 * useInfiniteScroll - Browser Mode Spec (Element Lifecycle)
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests element mount/unmount cycles with real scroll events.
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useInfiniteScroll } from ".";

function makeScrollContainer(
  opts: {
    containerHeight?: number;
    contentHeight?: number;
  } = {}
): { container: HTMLDivElement; content: HTMLDivElement } {
  const { containerHeight = 200, contentHeight = 800 } = opts;

  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "absolute",
    left: "0px",
    top: "0px",
    width: "200px",
    height: `${containerHeight}px`,
    overflow: "auto",
  });

  const content = document.createElement("div");
  Object.assign(content.style, {
    width: "200px",
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
// useInfiniteScroll — element lifecycle (real browser)
// ---------------------------------------------------------------------------

describe("useInfiniteScroll() — element lifecycle (real browser)", () => {
  it("Ref$ null → element: starts scroll observation, scroll triggers load", async () => {
    // Start with a null target
    const target$ = observable<OpaqueObject<Element> | null>(null);

    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll(target$ as any, onLoadMore, {
        direction: "bottom",
        interval: 0,
      })
    );

    // Now assign a real scrollable element
    const { container } = makeScrollContainer();
    cleanupFns.push(() => document.body.removeChild(container));

    act(() => {
      target$.set(ObservableHint.opaque(container));
    });

    // Scroll to bottom — should trigger onLoadMore now that element is assigned
    act(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
  });

  it("Ref$ element → null: stops triggering loads on scroll", async () => {
    const { container } = makeScrollContainer();
    cleanupFns.push(() => document.body.removeChild(container));

    const target$ = observable<OpaqueObject<Element> | null>(ObservableHint.opaque(container));

    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll(target$ as any, onLoadMore, {
        direction: "bottom",
        immediate: false,
        interval: 0,
      })
    );

    // Remove the element (set to null)
    act(() => {
      target$.set(null);
    });

    // Scroll to bottom — should NOT trigger load since element is null
    act(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    // Wait two animation frames to give any stale listener a chance to fire
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("full cycle (null → element → null → element): no leaked listeners or duplicate loads", async () => {
    const target$ = observable<OpaqueObject<Element> | null>(null);

    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScroll(target$ as any, onLoadMore, {
        direction: "bottom",
        immediate: false,
        interval: 0,
      })
    );

    const { container } = makeScrollContainer();
    cleanupFns.push(() => document.body.removeChild(container));

    // Cycle 1: assign element
    act(() => {
      target$.set(ObservableHint.opaque(container));
    });

    // Wait for IntersectionObserver to register visibility
    await new Promise<void>((r) => setTimeout(r, 100));

    // Scroll to bottom — load should fire exactly once
    act(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });

    // Wait for isLoading$ to clear
    await new Promise<void>((r) => setTimeout(r, 50));

    // Cycle 1: remove element
    act(() => {
      target$.set(null);
    });

    // Cycle 2: re-assign element
    act(() => {
      target$.set(ObservableHint.opaque(container));
    });

    // Wait for IntersectionObserver to re-register
    await new Promise<void>((r) => setTimeout(r, 100));

    // Scroll to top then back to bottom to ensure we re-trigger
    act(() => {
      container.scrollTop = 0;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await new Promise<void>((r) => setTimeout(r, 50));

    act(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(2), {
      timeout: 2000,
    });

    // Cycle 2: remove again — no more loads on subsequent scrolls
    act(() => {
      target$.set(null);
    });

    const countAfterRemoval = onLoadMore.mock.calls.length;

    act(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    // No new loads fired after element was removed — no leaked listeners
    expect(onLoadMore).toHaveBeenCalledTimes(countAfterRemoval);
  });
});
