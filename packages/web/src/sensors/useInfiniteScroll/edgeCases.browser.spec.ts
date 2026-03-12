/**
 * useInfiniteScroll - Browser Mode Spec (Edge Cases)
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests edge cases with real DOM layout and scroll events.
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useInfiniteScroll } from ".";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

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
// useInfiniteScroll — edge cases (real browser)
// ---------------------------------------------------------------------------

describe("useInfiniteScroll() — edge cases (real browser)", () => {
  it("rapid scroll does not trigger concurrent loads", async () => {
    const { container } = makeScrollContainer();
    cleanupFns.push(() => document.body.removeChild(container));

    // Track concurrent calls
    let inFlightCount = 0;
    let maxConcurrent = 0;

    const onLoadMore = vi.fn(async () => {
      inFlightCount++;
      maxConcurrent = Math.max(maxConcurrent, inFlightCount);
      await new Promise<void>((r) => setTimeout(r, 50));
      inFlightCount--;
    });

    renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        direction: "bottom",
        interval: 0,
      })
    );

    // Wait for IntersectionObserver to activate
    await new Promise<void>((r) => setTimeout(r, 100));

    // Fire many scroll events in rapid succession at the bottom boundary
    act(() => {
      for (let i = 0; i < 10; i++) {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      }
    });

    // Wait for the load to fire and settle
    await waitFor(() => expect(onLoadMore).toHaveBeenCalled(), {
      timeout: 2000,
    });

    await waitFor(
      () => {
        expect(inFlightCount).toBe(0);
      },
      { timeout: 2000 }
    );

    // Only one load should have been triggered at a time
    expect(maxConcurrent).toBe(1);
  });

  it("content shorter than container triggers immediate load when immediate=true (isNarrower)", async () => {
    // Container is taller than content — scrollHeight <= clientHeight → isNarrower() returns true.
    // The hook auto-triggers load without requiring a user scroll event.
    const { container } = makeScrollContainer({
      containerHeight: 400,
      contentHeight: 200,
    });
    cleanupFns.push(() => document.body.removeChild(container));

    const onLoadMore = vi.fn();

    renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        direction: "bottom",
        immediate: true,
        interval: 0,
      })
    );

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
  });

  it("does not trigger immediate load when immediate=false", async () => {
    const { container } = makeScrollContainer({
      containerHeight: 200,
      contentHeight: 800,
    });
    cleanupFns.push(() => document.body.removeChild(container));

    const onLoadMore = vi.fn();

    renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        direction: "bottom",
        immediate: false,
        interval: 0,
      })
    );

    // Yield two animation frames
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("auto-fill: loads when content is shorter than container, stops when filled", async () => {
    // Content starts shorter than container — isNarrower triggers auto-load.
    // onLoadMore makes content taller than container on first call.
    // After measure() re-checks, isNarrower returns false → no more loads.
    const { container, content } = makeScrollContainer({
      containerHeight: 400,
      contentHeight: 100,
    });
    cleanupFns.push(() => document.body.removeChild(container));

    const onLoadMore = vi.fn(() => {
      // Make content exceed container in one load
      content.style.height = "600px";
    });

    renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        direction: "bottom",
        immediate: true,
        interval: 0,
      })
    );

    // The hook should auto-trigger because isNarrower() is true
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });

    // After content grows past container, no additional loads should fire
    await new Promise<void>((r) => setTimeout(r, 300));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("canLoadMore blocks auto-fill when returning false", async () => {
    // Content is shorter than container — isNarrower would normally trigger load.
    // But canLoadMore returns false, so no load should fire.
    const { container } = makeScrollContainer({
      containerHeight: 400,
      contentHeight: 100,
    });
    cleanupFns.push(() => document.body.removeChild(container));

    const onLoadMore = vi.fn();

    renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        direction: "bottom",
        immediate: true,
        canLoadMore: () => false,
        interval: 0,
      })
    );

    // Give time for any loads to potentially fire
    await new Promise<void>((r) => setTimeout(r, 300));

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("interval prevents rapid consecutive loads", async () => {
    const { container } = makeScrollContainer({
      containerHeight: 200,
      contentHeight: 800,
    });
    cleanupFns.push(() => document.body.removeChild(container));

    const timestamps: number[] = [];
    const onLoadMore = vi.fn(() => {
      timestamps.push(performance.now());
    });

    renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        direction: "bottom",
        interval: 150,
      })
    );

    // First scroll to bottom
    act(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });

    // Scroll away and wait for interval + isLoading$ to clear
    act(() => {
      container.scrollTop = 0;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await new Promise<void>((r) => setTimeout(r, 200));

    // Scroll back to bottom
    act(() => {
      container.scrollTop = container.scrollHeight - container.clientHeight;
      container.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(2), {
      timeout: 2000,
    });

    if (timestamps.length >= 2) {
      const gap = timestamps[1] - timestamps[0];
      expect(gap).toBeGreaterThanOrEqual(140); // timing tolerance
    }
  });
});
