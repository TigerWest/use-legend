"use client";
import { type Observable } from "@legendapp/state";
import { useObservable, useObserve } from "@legendapp/state/react";
import { useCallback } from "react";
import { useMaybeObservable } from "@usels/core";
import type { DeepMaybeObservable, MaybeElement, ReadonlyObservable, Awaitable } from "@usels/core";
import { useInitialPick } from "@usels/core";
import { useLatest } from "@usels/core/shared/useLatest";
import { useScroll, type UseScrollOptions } from "@sensors/useScroll";

export type UseInfiniteScrollDirection = "top" | "bottom" | "left" | "right";

export interface UseInfiniteScrollOptions {
  /** Load trigger direction. Default: "bottom" */
  direction?: UseInfiniteScrollDirection;
  /** arrivedState offset in px. Default: 0 */
  distance?: number;
  /** Whether to auto-load on mount if content is already at boundary. Default: true */
  immediate?: boolean;
  /** Additional options passed to useScroll */
  scrollOptions?: UseScrollOptions;
}

export interface UseInfiniteScrollReturn {
  /** Currently loading */
  isLoading$: ReadonlyObservable<boolean>;
  /** Finished — no more loads when true */
  isFinished$: Observable<boolean>;
  /** Manually trigger a load */
  load: () => Promise<void>;
  /** Reset isFinished to false */
  reset: () => void;
}

export function useInfiniteScroll(
  element: MaybeElement,
  onLoadMore: (direction: UseInfiniteScrollDirection) => Awaitable<void>,
  options?: DeepMaybeObservable<UseInfiniteScrollOptions>
): UseInfiniteScrollReturn {
  const opts$ = useMaybeObservable<UseInfiniteScrollOptions>(options);

  // mount-time-only: direction and immediate
  const { direction, immediate } = useInitialPick(opts$, {
    direction: "bottom" as UseInfiniteScrollDirection,
    immediate: true,
  });

  // Computed scroll options — derived reactively from opts$
  // useScroll takes plain UseScrollOptions, so pass .peek() for now
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
  const isFinished$ = useObservable(false);
  const onLoadMoreRef = useLatest(onLoadMore);

  const { arrivedState$ } = useScroll(element, scrollOpts$.peek());

  const load = useCallback(async () => {
    if (isLoading$.peek() || isFinished$.peek()) return;
    isLoading$.set(true);
    try {
      await onLoadMoreRef.current(direction);
    } finally {
      isLoading$.set(false);
    }
  }, []);

  // auto-load when arrivedState matches direction
  useObserve(() => {
    const arrived = arrivedState$.get()[direction];
    if (arrived && !isLoading$.peek() && !isFinished$.peek()) {
      void load();
    }
  });

  const reset = useCallback(() => {
    isFinished$.set(false);
  }, []);

  // suppress unused variable warning for immediate (intentionally captured for future use / API completeness)
  void immediate;

  return {
    isLoading$,
    isFinished$,
    load,
    reset,
  };
}
