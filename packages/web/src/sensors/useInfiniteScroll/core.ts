import { observable, type Observable } from "@legendapp/state";
import { observe, peek, type DeepMaybeObservable, type ReadonlyObservable, type Awaitable } from "@usels/core";
import { isWindow } from "@usels/core/shared/index";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createScroll, type UseScrollOptions } from "../useScroll/core";
import { createElementVisibility } from "../../elements/useElementVisibility/core";

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

/**
 * Framework-agnostic infinite scroll core.
 *
 * Triggers `onLoadMore` whenever the scroll position reaches the configured
 * boundary of a scrollable element. Composes `createScroll` and
 * `createElementVisibility`. Must be called inside a `useScope` factory.
 */
export function createInfiniteScroll(
  element: MaybeEventTarget<Element | Document | Window>,
  onLoadMore: (direction: UseInfiniteScrollDirection) => Awaitable<void>,
  options?: DeepMaybeObservable<UseInfiniteScrollOptions>
): UseInfiniteScrollReturn {
  const opts$ = observable(options);
  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  // Mount-time-only: direction and immediate cannot change meaningfully after mount
  const direction: UseInfiniteScrollDirection = opts$.peek()?.direction ?? "bottom";
  const immediate: boolean = opts$.peek()?.immediate ?? true;

  // Reactive scroll options — derived from opts$
  const scrollOpts$ = observable<UseScrollOptions>(() => {
    const distance = opts$.get()?.distance ?? 0;
    const extra = opts$.get()?.scrollOptions;
    return {
      ...extra,
      offset: {
        ...extra?.offset,
        [direction]: distance + 1, // +1px tolerance for sub-pixel scroll boundaries
      },
    };
  });

  const isLoading$ = observable(false);

  const { arrivedState$, measure } = createScroll(element, scrollOpts$ as never);
  const isVisible$ = createElementVisibility(element);

  function isNarrower(): boolean {
    const el = peek(element);
    if (!el) return false;
    const isVertical = direction === "top" || direction === "bottom";
    if (isWindow(el)) {
      const win = win$.peek();
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

  const load = async (): Promise<void> => {
    if (isLoading$.peek()) return;
    if (!isVisible$.peek()) return;

    const canLoadMore = opts$.peek()?.canLoadMore;
    if (canLoadMore) {
      const el = peek(element);
      const domEl = isWindow(el)
        ? (win$.peek()?.document.documentElement ?? null)
        : (el as HTMLElement | null);
      if (domEl && !canLoadMore(domEl as HTMLElement)) return;
    }

    isLoading$.set(true);
    try {
      const interval = opts$.peek()?.interval ?? 100;
      await Promise.all([
        onLoadMore(direction),
        new Promise((r) => setTimeout(r, interval)),
      ]);
    } finally {
      isLoading$.set(false);
      setTimeout(() => {
        measure();
      }, 0);
    }
  };

  // Auto-load when arrivedState matches direction or content doesn't overflow
  observe(() => {
    if (!immediate && !arrivedState$.get()) return; // skip auto-fill on mount when immediate=false
    const isVisible = isVisible$.get();
    const arrived = arrivedState$.get()[direction];
    if (!isVisible || isLoading$.peek()) return;

    const canLoadMore = opts$.peek()?.canLoadMore;
    if (canLoadMore) {
      const el = peek(element);
      const domEl = isWindow(el)
        ? (win$.peek()?.document.documentElement ?? null)
        : (el as HTMLElement | null);
      if (domEl && !canLoadMore(domEl as HTMLElement)) return;
    }

    if (arrived || isNarrower()) {
      void load();
    }
  });

  const reset = (): void => {
    setTimeout(() => {
      measure();
    }, 0);
  };

  return {
    isLoading$: isLoading$ as ReadonlyObservable<boolean>,
    load,
    reset,
  };
}
