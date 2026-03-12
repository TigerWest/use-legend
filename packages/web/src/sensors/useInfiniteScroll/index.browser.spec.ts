/**
 * useInfiniteScroll - Browser Mode Spec (Core Functionality)
 *
 * Runs in real Playwright Chromium (not jsdom).
 * Tests real scroll events with actual DOM layout.
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

/** Wait for IntersectionObserver to detect the element as visible. */
const waitForVisibility = () => new Promise<void>((r) => setTimeout(r, 100));

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
  // initial values
  // -------------------------------------------------------------------------

  describe("initial values", () => {
    it("isLoading$ defaults to false", () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      const { result } = renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, { immediate: false })
      );

      expect(result.current.isLoading$.get()).toBe(false);
    });
  });

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
      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          interval: 0,
        })
      );

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
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          interval: 0,
        })
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
          interval: 0,
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
          interval: 0,
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
      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "right",
          interval: 0,
        })
      );

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
          interval: 0,
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
          interval: 0,
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

  // -------------------------------------------------------------------------
  // guards
  // -------------------------------------------------------------------------

  describe("guards", () => {
    it("does not call onLoadMore when isLoading$=true (concurrent guard)", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      let resolveFirst!: () => void;
      const firstPromise = new Promise<void>((r) => {
        resolveFirst = r;
      });
      const onLoadMore = vi.fn(() => firstPromise);

      const { result } = renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          interval: 0,
        })
      );

      // Scroll to bottom to trigger first load
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(result.current.isLoading$.get()).toBe(true), {
        timeout: 2000,
      });
      expect(onLoadMore).toHaveBeenCalledTimes(1);

      // Manually trigger another load — should be ignored because isLoading$ is true
      await act(async () => {
        await result.current.load();
      });

      expect(onLoadMore).toHaveBeenCalledTimes(1);

      // Cleanup
      await act(async () => {
        resolveFirst();
        await firstPromise;
      });
    });
  });

  // -------------------------------------------------------------------------
  // controls
  // -------------------------------------------------------------------------

  describe("controls", () => {
    it("load() manually triggers onLoadMore", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      const { result } = renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          immediate: false,
          interval: 0,
        })
      );

      // Wait for IntersectionObserver to detect the element as visible
      await waitForVisibility();

      await act(async () => {
        await result.current.load();
      });

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it("reset() re-checks scroll position and triggers load if at boundary", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      const { result } = renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          immediate: false,
          interval: 0,
        })
      );

      // Scroll to bottom without firing scroll event
      container.scrollTop = container.scrollHeight - container.clientHeight;

      // Call reset — it schedules measure() via setTimeout which re-evaluates scroll position
      act(() => {
        result.current.reset();
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });
  });

  // -------------------------------------------------------------------------
  // async support
  // -------------------------------------------------------------------------

  describe("async support", () => {
    it("awaits Promise-returning onLoadMore before clearing isLoading$", async () => {
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
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          interval: 0,
        })
      );

      // Trigger via scroll (which bypasses visibility check since useObserve checks isVisible$.get())
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(result.current.isLoading$.get()).toBe(true), {
        timeout: 2000,
      });

      await act(async () => {
        resolveLoad();
        await loadPromise;
      });

      await waitFor(() => expect(result.current.isLoading$.get()).toBe(false), {
        timeout: 2000,
      });
    });

    it("onLoadMore error does not leave isLoading$ stuck", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn(() => Promise.reject(new Error("load failed")));

      const { result } = renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          immediate: false,
          interval: 0,
        })
      );

      // Wait for IntersectionObserver visibility
      await waitForVisibility();

      await act(async () => {
        await result.current.load().catch(() => {});
      });

      await waitFor(() => expect(result.current.isLoading$.get()).toBe(false), {
        timeout: 2000,
      });
    });
  });

  // -------------------------------------------------------------------------
  // unmount cleanup
  // -------------------------------------------------------------------------

  describe("unmount cleanup", () => {
    it("does not call onLoadMore after unmount", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      const { unmount } = renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          immediate: false,
          interval: 0,
        })
      );

      unmount();

      // Wait two animation frames
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      // Scroll to bottom after unmount — should not trigger onLoadMore
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // null target
  // -------------------------------------------------------------------------

  describe("null target", () => {
    it("null element is safe — no errors", () => {
      const onLoadMore = vi.fn();
      expect(() => {
        const { result } = renderHook(() => useInfiniteScroll(null, onLoadMore));
        expect(result.current.isLoading$.get()).toBe(false);
      }).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // canLoadMore
  // -------------------------------------------------------------------------

  describe("canLoadMore", () => {
    it("canLoadMore=false blocks loading", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          canLoadMore: () => false,
          interval: 0,
        })
      );

      // Scroll to bottom
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it("canLoadMore=true allows loading", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          canLoadMore: () => true,
          interval: 0,
        })
      );

      // Scroll to bottom
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });

    it("canLoadMore receives the container element", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const canLoadMore = vi.fn(() => true);
      const onLoadMore = vi.fn();

      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          canLoadMore,
          interval: 0,
        })
      );

      // Scroll to bottom
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(canLoadMore).toHaveBeenCalled(), {
        timeout: 2000,
      });

      expect(canLoadMore).toHaveBeenCalledWith(container);
    });
  });

  // -------------------------------------------------------------------------
  // interval
  // -------------------------------------------------------------------------

  describe("interval", () => {
    it("minimum interval enforced between loads", async () => {
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const timestamps: number[] = [];
      const onLoadMore = vi.fn(() => {
        timestamps.push(performance.now());
      });

      // Use scroll-triggered loads to test interval.
      // The interval is enforced via Promise.all([onLoadMore, delay]) in load().
      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          interval: 150,
        })
      );

      // First scroll to bottom — triggers load
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });

      // Scroll away then back to trigger a second load
      act(() => {
        container.scrollTop = 0;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      // Wait for interval to complete (isLoading$ clears after interval)
      await new Promise<void>((r) => setTimeout(r, 200));

      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(2), {
        timeout: 2000,
      });

      if (timestamps.length >= 2) {
        const gap = timestamps[1] - timestamps[0];
        expect(gap).toBeGreaterThanOrEqual(140); // allow small timing tolerance
      }
    });
  });

  // -------------------------------------------------------------------------
  // visibility gating
  // -------------------------------------------------------------------------

  describe("visibility gating", () => {
    it("element appended to body is visible and loads fire", async () => {
      // In a real browser, elements appended to document.body ARE visible
      // to IntersectionObserver, so useElementVisibility returns true
      const { container } = makeScrollContainer({
        containerHeight: 200,
        contentHeight: 800,
      });
      cleanupFns.push(() => document.body.removeChild(container));

      const onLoadMore = vi.fn();
      renderHook(() =>
        useInfiniteScroll(wrapEl(container), onLoadMore, {
          direction: "bottom",
          interval: 0,
        })
      );

      // Scroll to bottom
      act(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
        container.dispatchEvent(new Event("scroll", { bubbles: true }));
      });

      await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1), {
        timeout: 2000,
      });
    });
  });
});
