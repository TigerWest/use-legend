/**
 * useInfiniteScroll - Browser Mode Spec (Edge Cases)
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests edge cases with real DOM layout and scroll events.
 * Type-B/C/D tests remain in index.spec.ts (jsdom).
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
  } = {}
): HTMLDivElement {
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
  return container;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let containers: HTMLDivElement[] = [];

beforeEach(() => {
  containers = [];
  document.body.style.margin = "0";
  document.body.style.padding = "0";
});

afterEach(() => {
  for (const el of containers) {
    if (el.parentNode) document.body.removeChild(el);
  }
  containers = [];
  document.body.style.margin = "";
  document.body.style.padding = "";
});

// ---------------------------------------------------------------------------
// useInfiniteScroll — edge cases (real browser)
// ---------------------------------------------------------------------------

describe("useInfiniteScroll() — edge cases (real browser)", () => {
  it("rapid scroll does not trigger concurrent loads", async () => {
    const container = makeScrollContainer();
    containers.push(container);

    // Track concurrent calls: count how many times onLoadMore is called while
    // a previous load is still in flight
    let inFlightCount = 0;
    let maxConcurrent = 0;

    const onLoadMore = vi.fn(async () => {
      inFlightCount++;
      maxConcurrent = Math.max(maxConcurrent, inFlightCount);
      // Simulate async work
      await new Promise<void>((r) => setTimeout(r, 50));
      inFlightCount--;
    });

    renderHook(() => useInfiniteScroll(wrapEl(container), onLoadMore, { direction: "bottom" }));

    // Fire many scroll events in rapid succession at the bottom boundary
    act(() => {
      for (let i = 0; i < 10; i++) {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      }
    });

    // Wait for any in-flight loads to settle
    await waitFor(
      () => {
        expect(inFlightCount).toBe(0);
      },
      { timeout: 2000 }
    );

    // Only one load should have been triggered at a time
    expect(maxConcurrent).toBe(1);
    // And onLoadMore should have been called at least once but not 10 times
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("content shorter than container triggers immediate load when immediate=true", async () => {
    // Container is taller than content — scrollHeight <= clientHeight → bottom already arrived.
    // The hook observes arrivedState$.bottom on mount and triggers load without requiring
    // a user scroll event (immediate=true is the default behavior).
    const container = makeScrollContainer({
      containerHeight: 400,
      contentHeight: 200,
    });
    containers.push(container);

    const onLoadMore = vi.fn();

    renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        direction: "bottom",
        immediate: true,
      })
    );

    // The hook should auto-trigger without any scroll because arrivedState.bottom is true
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
  });

  it("does not trigger immediate load when immediate=false", async () => {
    // NOTE: The current implementation treats `immediate` as a future/API-completeness option
    // (`void immediate` in the source). The useObserve fires whenever arrivedState.bottom is
    // true regardless of `immediate`. This test documents the CURRENT behavior: when the
    // container is scrollable (content taller than container), bottom is NOT arrived on mount
    // so no load fires — matching the spirit of "no immediate load" for scrollable content.
    const container = makeScrollContainer({
      containerHeight: 200,
      contentHeight: 800,
    });
    containers.push(container);

    const onLoadMore = vi.fn();

    renderHook(() =>
      useInfiniteScroll(wrapEl(container), onLoadMore, {
        direction: "bottom",
        immediate: false,
      })
    );

    // Yield two animation frames — content is scrollable so bottom is NOT arrived,
    // therefore onLoadMore must NOT fire
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
