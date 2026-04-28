import { observable, ObservableHint, type Observable } from "@legendapp/state";
import { get, createObserve, type DeepMaybeObservable } from "@usels/core";
import {
  createIntersectionObserver,
  type UseIntersectionObserverOptions,
} from "@elements/useIntersectionObserver/core";
import { normalizeTargets } from "@shared/normalizeTargets";
import type { MaybeEventTarget } from "../../types";

export interface UseElementVisibilityOptions {
  /** Initial visibility value. Default: false */
  initialValue?: boolean;
  /** Element used as the viewport for intersection. Maps to IntersectionObserver `root`. */
  scrollTarget?: MaybeEventTarget;
  /** Margin around the root. Accepts CSS-style values. Default: "0px" */
  rootMargin?: string;
  /** Threshold(s) at which to trigger. Default: 0 */
  threshold?: number | number[];
  /**
   * Stop observing after the element becomes visible for the first time. Default: false.
   * Must be set at mount time; changing dynamically has no effect.
   */
  once?: boolean;
}

/**
 * Framework-agnostic reactive element visibility tracker.
 *
 * Tracks whether a DOM element is intersecting the viewport (or a specified
 * scroll container). Returns a reactive `Observable<boolean>` that updates
 * automatically via the IntersectionObserver API.
 *
 * @param element - Element to observe (Ref$, Observable element, or raw element).
 * @param options - Optional configuration — plain, per-field Observable, or fully Observable.
 * @returns `Observable<boolean>` — true when element is intersecting.
 */
export function createElementVisibility(
  element: MaybeEventTarget,
  options?: DeepMaybeObservable<UseElementVisibilityOptions>
): Observable<boolean> {
  const opts$ = observable(options);
  const isVisible$ = observable<boolean>(
    (opts$.peek()?.initialValue as boolean | undefined) ?? false
  );

  // Map scrollTarget → root for createIntersectionObserver. Use a computed
  // observable so per-field changes propagate through a single reactive path.
  // Wrap the resolved root element with `ObservableHint.opaque` so Legend-State
  // does not deep-proxy the HTMLElement when caching the computed value.
  const ioOpts$ = observable<UseIntersectionObserverOptions>(() => {
    const raw = get(opts$);
    const rootVal = get(raw?.scrollTarget) as UseIntersectionObserverOptions["root"];
    return {
      root: rootVal != null ? ObservableHint.opaque(rootVal as object) : rootVal,
      rootMargin: get(raw?.rootMargin) as string | undefined,
      threshold: get(raw?.threshold) as number | number[] | undefined,
    };
  });

  const { stop } = createIntersectionObserver(
    element,
    (entries) => {
      if (entries.length === 0) return;
      const latest = entries.reduce((a, b) => (a.time > b.time ? a : b));
      isVisible$.set(latest.isIntersecting);

      if ((opts$.peek()?.once as boolean | undefined) && latest.isIntersecting) {
        stop();
      }
    },
    ioOpts$ as Observable<UseIntersectionObserverOptions>
  );

  // Reset visibility when target element is removed
  createObserve(() => {
    const targets = normalizeTargets(element);
    if (!targets.length) {
      isVisible$.set((opts$.peek()?.initialValue as boolean | undefined) ?? false);
    }
  });

  return isVisible$;
}
