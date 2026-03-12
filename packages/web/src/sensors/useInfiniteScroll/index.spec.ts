// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { observable, ObservableHint } from "@legendapp/state";
import type { OpaqueObject } from "@legendapp/state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useInfiniteScroll } from ".";

const wrapEl = (el: Element) => observable<OpaqueObject<Element> | null>(ObservableHint.opaque(el));

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

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
    scrollLeft = 0,
    scrollTop = 0,
    scrollWidth = 500,
    scrollHeight = 1000,
    clientWidth = 300,
    clientHeight = 400,
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

describe("useInfiniteScroll()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // initial values
  // ---------------------------------------------------------------------------

  describe("initial values", () => {
    it("isLoading$ defaults to false", () => {
      // Scrollable element: arrivedState.bottom starts false → no auto-load
      const el = makeEl({ scrollHeight: 1000, clientHeight: 400 });
      const onLoadMore = vi.fn();
      const { result } = renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));
      expect(result.current.isLoading$.get()).toBe(false);
    });

    it("isFinished$ defaults to false", () => {
      const el = makeEl({ scrollHeight: 1000, clientHeight: 400 });
      const onLoadMore = vi.fn();
      const { result } = renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));
      expect(result.current.isFinished$.get()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // auto load on scroll
  // ---------------------------------------------------------------------------

  describe("auto load on scroll", () => {
    it("calls onLoadMore when scroll reaches bottom", async () => {
      const onLoadMore = vi.fn();
      // Scrollable element: scrollHeight=1000, clientHeight=400 → maxY=600
      const el = makeEl({ scrollHeight: 1000, clientHeight: 400, scrollTop: 0 });
      renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));

      // Scroll to bottom
      act(() => {
        (el as any).scrollTop = 600;
        el.dispatchEvent(new Event("scroll"));
      });
      await act(async () => {
        await flush();
      });

      expect(onLoadMore).toHaveBeenCalledTimes(1);
      expect(onLoadMore).toHaveBeenCalledWith("bottom");
    });

    it("calls onLoadMore when element is set later via Observable (Ref$ pattern)", async () => {
      const onLoadMore = vi.fn();
      // Simulate Ref$ pattern: element starts as null
      const el$ = observable<OpaqueObject<HTMLDivElement> | null>(null);
      const el = makeEl({ scrollHeight: 1000, clientHeight: 400, scrollTop: 0 });

      renderHook(() => useInfiniteScroll(el$, onLoadMore));

      // Element appears (simulates React ref callback / Ref$ mount)
      act(() => {
        el$.set(ObservableHint.opaque(el));
      });
      await act(async () => {
        await flush();
      });

      // Scroll to bottom
      act(() => {
        (el as any).scrollTop = 600;
        el.dispatchEvent(new Event("scroll"));
      });
      await act(async () => {
        await flush();
      });

      expect(onLoadMore).toHaveBeenCalledTimes(1);
      expect(onLoadMore).toHaveBeenCalledWith("bottom");
    });

    it("does not call onLoadMore when scroll is not at boundary", async () => {
      const onLoadMore = vi.fn();
      const el = makeEl({ scrollHeight: 1000, clientHeight: 400, scrollTop: 0 });
      renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));

      // Scroll to middle (not at bottom)
      act(() => {
        (el as any).scrollTop = 300;
        el.dispatchEvent(new Event("scroll"));
      });
      await act(async () => {
        await flush();
      });

      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // guards
  // ---------------------------------------------------------------------------

  describe("guards", () => {
    it("does not call onLoadMore when isLoading$=true", async () => {
      // Use a non-resolving promise to keep isLoading$ stuck at true
      let resolveFirst!: () => void;
      const firstPromise = new Promise<void>((r) => {
        resolveFirst = r;
      });
      const onLoadMore = vi.fn(() => firstPromise);

      // Non-scrollable → arrivedState.bottom=true immediately → first load fires
      const el = makeEl({ scrollHeight: 400, clientHeight: 400 });
      const { result } = renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));

      await act(async () => {
        el.dispatchEvent(new Event("scroll"));
        await flush();
      });

      // isLoading$ should be true now (first load pending)
      expect(result.current.isLoading$.get()).toBe(true);
      expect(onLoadMore).toHaveBeenCalledTimes(1);

      // Manually trigger another load — should be ignored
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

    it("does not call onLoadMore when isFinished$=true", async () => {
      const onLoadMore = vi.fn();
      // Scrollable element so no auto-load on mount
      const el = makeEl({ scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));

      // Mark as finished
      act(() => {
        result.current.isFinished$.set(true);
      });

      // Scroll to bottom to trigger arrivedState.bottom=true
      act(() => {
        (el as any).scrollTop = 600; // maxScrollY = 1000 - 400 = 600
        el.dispatchEvent(new Event("scroll"));
      });
      await act(async () => {
        await flush();
      });

      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // controls
  // ---------------------------------------------------------------------------

  describe("controls", () => {
    it("load() manually triggers onLoadMore", async () => {
      const onLoadMore = vi.fn();
      const el = makeEl({ scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));

      await act(async () => {
        await result.current.load();
      });

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it("reset() clears isFinished$ so loading can resume", async () => {
      const onLoadMore = vi.fn();
      const el = makeEl({ scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));

      // Mark finished then reset
      act(() => {
        result.current.isFinished$.set(true);
      });
      expect(result.current.isFinished$.get()).toBe(true);

      act(() => {
        result.current.reset();
      });
      expect(result.current.isFinished$.get()).toBe(false);

      // After reset, load() should work again
      await act(async () => {
        await result.current.load();
      });
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // async support
  // ---------------------------------------------------------------------------

  describe("async support", () => {
    it("awaits Promise-returning onLoadMore before clearing isLoading$", async () => {
      let resolve!: () => void;
      const promise = new Promise<void>((r) => {
        resolve = r;
      });
      const onLoadMore = vi.fn(() => promise);

      const el = makeEl({ scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));

      // Start load without awaiting so isLoading$ stays true mid-flight
      let loadSettled = false;
      act(() => {
        void result.current.load().then(() => {
          loadSettled = true;
        });
      });
      await flush();

      // isLoading$ should be true while promise is pending
      expect(result.current.isLoading$.get()).toBe(true);
      expect(loadSettled).toBe(false);

      await act(async () => {
        resolve();
        await promise;
        await flush();
      });

      expect(result.current.isLoading$.get()).toBe(false);
    });

    it("onLoadMore error does not leave isLoading$ stuck", async () => {
      const onLoadMore = vi.fn(() => Promise.reject(new Error("load failed")));

      const el = makeEl({ scrollHeight: 1000, clientHeight: 400 });
      const { result } = renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));

      await act(async () => {
        // load() swallows the error via try/finally
        await result.current.load().catch(() => {});
        await flush();
      });

      expect(result.current.isLoading$.get()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // unmount cleanup
  // ---------------------------------------------------------------------------

  describe("unmount cleanup", () => {
    it("does not call onLoadMore after unmount", async () => {
      const onLoadMore = vi.fn();
      const el = makeEl({ scrollHeight: 1000, clientHeight: 400 });
      const { unmount } = renderHook(() => useInfiniteScroll(wrapEl(el), onLoadMore));

      unmount();
      await flush();

      // Scroll to bottom after unmount — should not trigger onLoadMore
      act(() => {
        (el as any).scrollTop = 600;
        el.dispatchEvent(new Event("scroll"));
      });
      await act(async () => {
        await flush();
      });

      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // null target
  // ---------------------------------------------------------------------------

  describe("null target", () => {
    it("null element is safe — no errors", () => {
      const onLoadMore = vi.fn();
      expect(() => {
        const { result } = renderHook(() => useInfiniteScroll(null, onLoadMore));
        expect(result.current.isLoading$.get()).toBe(false);
        expect(result.current.isFinished$.get()).toBe(false);
      }).not.toThrow();
    });
  });
});
