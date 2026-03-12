/**
 * useInfiniteScroll - Browser Mode Spec (Core Functionality)
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests real scroll events with actual DOM layout.
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

/** Create a scrollable container with a tall inner content element. */
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
// useInfiniteScroll — real browser (core functionality)
// ---------------------------------------------------------------------------

describe("useInfiniteScroll() — real browser", () => {
  // -------------------------------------------------------------------------
  // auto load
  // -------------------------------------------------------------------------

  describe("auto load", () => {
    it("calls onLoadMore when scroll reaches bottom", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      renderHook(() => useInfiniteScroll(wrapEl(container), onLoadMore, { direction: "bottom" }));

      // Scroll to the bottom
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });

    it("sets isLoading$=true during load, false after", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      let resolveLoad!: () => void;
      const loadPromise = new Promise<void>((r) => {
        resolveLoad = r;
      });
      const onLoadMore = vi.fn(() => loadPromise);

      const { result } = renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, { direction: "bottom" })
      );

      // Scroll to bottom to trigger auto-load
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      // Wait for loading to start
      await waitFor(() => expect(result.current.isLoading$.get()).toBe(true), {
        timeout: 2000,
      });

      // Resolve the load
      await act(async () => {
        resolveLoad();
        await loadPromise;
      });

      await waitFor(() => expect(result.current.isLoading$.get()).toBe(false), {
        timeout: 2000,
      });
    });
  });

  // -------------------------------------------------------------------------
  // direction
  // -------------------------------------------------------------------------

  describe("direction", () => {
    it("triggers on top arrival when direction='top'", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();

      // Start scrolled to bottom so top is NOT arrived
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
      });

      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "top",
          immediate: false,
        })
      );

      // Scroll back to top
      act(() => {
        container.scrollTop = 0;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });

    it("triggers on left arrival when direction='left'", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 200,
        containerWidth: 200,
        contentWidth: 800,
      });
      // Make overflow horizontal
      container.style.overflowX = "auto";
      container.style.overflowY = "hidden";
      container.style.whiteSpace = "nowrap";
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();

      // Start scrolled to right so left is NOT arrived
      act(() => {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
      });

      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "left",
          immediate: false,
        })
      );

      // Scroll back to left
      act(() => {
        container.scrollLeft = 0;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });

    it("triggers on right arrival when direction='right'", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 200,
        containerWidth: 200,
        contentWidth: 800,
      });
      container.style.overflowX = "auto";
      container.style.overflowY = "hidden";
      container.style.whiteSpace = "nowrap";
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      renderHook(() => useInfiniteScroll(wrapEl(container), onLoadMore, { direction: "right" }));

      // Scroll to the right end
      act(() => {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });
  });

  // -------------------------------------------------------------------------
  // distance
  // -------------------------------------------------------------------------

  describe("distance", () => {
    it("distance=0 triggers at exact boundary", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          distance: 0,
        })
      );

      // Scroll exactly to the boundary
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });

    it("distance=N triggers N px before boundary", async () => {
      const distance = 50;
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          distance,
        })
      );

      // Scroll to N px before the end — should trigger
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight - distance;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });
  });
});
