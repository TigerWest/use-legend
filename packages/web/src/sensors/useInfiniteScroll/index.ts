"use client";
import { useObservable, useObserve } from "@legendapp/state/react";
import { useCallback } from "react";
import { useMaybeObservable, peek } from "@usels/core";
import type { DeepMaybeObservable, ReadonlyObservable, Awaitable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { useInitialPick } from "@usels/core";
import { useLatest } from "@usels/core/shared/useLatest";
import { isWindow } from "@usels/core/shared/index";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useScroll, type UseScrollOptions } from "@sensors/useScroll";
import { useElementVisibility } from "@elements/useElementVisibility";

export type UseInfiniteScrollDirection = "top" | "bottom" | "left" | "right";

export interface UseInfiniteScrollOptions extends ConfigurableWindow {
  /** Load trigger direction. Default: "bottom" */
  direction?: UseInfiniteScrollDirection;
  /** arrivedState offset in px. Default: 0 */
  distance?: number;
  /** Whether to auto-load on mount if content is already at boundary. Default: true */
  immediate?: boolean;
  /** Minimum ms between consecutive load triggers. Default: 100 */
  interval?: number;
  /** Gate function — return false to block loading. Evaluated before each load. */
  canLoadMore?: (el: HTMLElement) => boolean;
  /** Additional options passed to useScroll */
  scrollOptions?: UseScrollOptions;
}

export interface UseInfiniteScrollReturn {
  /** Currently loading */
  isLoading$: ReadonlyObservable<boolean>;
  /** Manually trigger a load */
  load: () => Promise<void>;
  /** Re-check scroll position and trigger load if needed */
  reset: () => void;
}

export function useInfiniteScroll(
  element: MaybeEventTarget<Element | Document | Window>,
  onLoadMore: (direction: UseInfiniteScrollDirection) => Awaitable<void>,
  options?: DeepMaybeObservable<UseInfiniteScrollOptions>
): UseInfiniteScrollReturn {
  const opts$ = useMaybeObservable<UseInfiniteScrollOptions>(options, { window: "element" });

  const window$ = useResolvedWindow(opts$.window);

  // mount-time-only: direction and immediate
  const { direction, immediate } = useInitialPick(opts$, {
    direction: "bottom" as UseInfiniteScrollDirection,
    immediate: true,
  });

  // Computed scroll options — derived reactively from opts$
  const scrollOpts$ = useObservable<UseScrollOptions>(() => {
    const distance = opts$.distance.get() ?? 0;
    const extra = opts$.scrollOptions.get();
    return {
      ...extra,
      offset: {
        ...extra?.offset,
        [direction]: distance + 1, // +1px tolerance for sub-pixel scroll boundaries
      },
    };
  });

  const isLoading$ = useObservable(false);
  const onLoadMoreRef = useLatest(onLoadMore);

  const { arrivedState$, measure } = useScroll(element, scrollOpts$);

  const isVisible$ = useElementVisibility(element);

  const load = useCallback(async () => {
    if (isLoading$.peek()) return;
    if (!isVisible$.peek()) return;

    const opts = opts$.peek();
    const canLoadMore = opts?.canLoadMore;
    if (canLoadMore) {
      const el = peek(element);
      const domEl = isWindow(el)
        ? (window$.peek()?.document.documentElement ?? null)
        : (el as HTMLElement | null);
      if (domEl && !canLoadMore(domEl as HTMLElement)) return;
    }

    isLoading$.set(true);
    try {
      const interval = opts?.interval ?? 100;
      await Promise.all([
        onLoadMoreRef.current(direction),
        new Promise((r) => setTimeout(r, interval)),
      ]);
    } finally {
      isLoading$.set(false);
      // schedule a re-check for auto-fill loop
      setTimeout(() => {
        measure();
      }, 0);
    }
  }, []);

  // Check if content doesn't overflow the container
  function isNarrower(): boolean {
    const el = peek(element);
    if (!el) return false;
    const isVertical = direction === "top" || direction === "bottom";
    if (isWindow(el)) {
      const win = window$.peek();
      const docEl = win?.document.documentElement;
      if (!docEl || !win) return false;
      return isVertical
        ? docEl.scrollHeight <= win.innerHeight
        : docEl.scrollWidth <= win.innerWidth;
    }
    const domEl = el as HTMLElement;
    return isVertical
      ? domEl.scrollHeight <= domEl.clientHeight
      : domEl.scrollWidth <= domEl.clientWidth;
  }

  // auto-load when arrivedState matches direction or content doesn't overflow
  useObserve(() => {
    if (!immediate && !arrivedState$.get()) return; // skip auto-fill on mount when immediate=false
    const isVisible = isVisible$.get();
    const arrived = arrivedState$.get()[direction];
    if (!isVisible || isLoading$.peek()) return;

    const opts = opts$.peek();
    const canLoadMore = opts?.canLoadMore;
    if (canLoadMore) {
      const el = peek(element);
      const domEl = isWindow(el)
        ? (window$.peek()?.document.documentElement ?? null)
        : (el as HTMLElement | null);
      if (domEl && !canLoadMore(domEl as HTMLElement)) return;
    }

    if (arrived || isNarrower()) {
      void load();
    }
  });

  const reset = useCallback(() => {
    setTimeout(() => {
      measure();
    }, 0);
  }, []);

  return {
    isLoading$,
    load,
    reset,
  };
}
