import type { Observable } from "@legendapp/state";
import { useObservable, useObserve } from "@legendapp/state/react";
import { useEffect, useRef } from "react";
import { get } from "../../function/get";
import type { MaybeObservable } from "../../types";
import { getElement, isEl$, peekElement } from "../useEl$";
import type { MaybeElement } from "../useEl$";
import { normalizeTargets } from "../useResizeObserver";

export interface UseIntersectionObserverOptions {
  /** Whether to start observing immediately on mount. Default: true */
  immediate?: boolean;
  /** The element or document used as the viewport. Default: browser viewport */
  root?: MaybeElement;
  /** Margin around the root. Accepts CSS-style values. Default: "0px" */
  rootMargin?: MaybeObservable<string>;
  /** Threshold(s) at which to trigger the callback. Default: 0 */
  threshold?: number | number[];
}

export interface UseIntersectionObserverReturn {
  isSupported: Observable<boolean>;
  isActive: Observable<boolean>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Reactive wrapper around the IntersectionObserver API.
 * Observes one or more elements for intersection changes with pause/resume/stop support.
 *
 * @param target - Element(s) to observe: El$, Observable, raw Element, or array of these
 * @param callback - Called when intersection state changes
 * @param options - IntersectionObserver options plus an `immediate` flag
 * @returns `{ isSupported, isActive, pause, resume, stop }`
 *
 * @example
 * ```tsx
 * const el$ = useEl$<HTMLDivElement>();
 * const { isActive, pause, resume } = useIntersectionObserver(
 *   el$,
 *   (entries) => {
 *     entries.forEach(entry => console.log(entry.isIntersecting));
 *   },
 *   { threshold: 0.5 },
 * );
 * return <div ref={el$} />;
 * ```
 */
export function useIntersectionObserver(
  target: MaybeElement | MaybeElement[],
  callback: IntersectionObserverCallback,
  options?: UseIntersectionObserverOptions,
): UseIntersectionObserverReturn {
  const isSupported$ = useObservable<boolean>(
    typeof IntersectionObserver !== "undefined",
  );
  const isActive$ = useObservable<boolean>(options?.immediate !== false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const stoppedRef = useRef(false);
  const mountedRef = useRef(false);

  const cleanup = () => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  };

  const setup = () => {
    if (!isSupported$.peek() || !isActive$.peek()) return;

    cleanup();

    let root: HTMLElement | Document | null | undefined = undefined;
    if (options?.root !== undefined) {
      root = peekElement(options.root);
      // El$ not yet mounted — skip setup until element is available
      if (isEl$(options.root) && root === null) return;
    }
    const rootMargin = get(options?.rootMargin);

    observerRef.current = new IntersectionObserver(callback, {
      root: root ?? undefined,
      rootMargin,
      threshold: options?.threshold ?? 0,
    });

    const targets = normalizeTargets(target);
    targets.forEach((el) => observerRef.current?.observe(el));
  };

  // Initial setup after DOM is committed; cleanup on unmount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    mountedRef.current = true;
    setup();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  // Re-run setup when reactive options (root, rootMargin), isActive$, or target changes.
  // normalizeTargets(target) registers El$/Observable target dependencies for reactive tracking.
  // mountedRef guard prevents a redundant setup on the initial synchronous run.
  useObserve(() => {
    if (options?.root !== undefined) getElement(options.root); // registers tracking dependency
    if (options?.rootMargin !== undefined) get(options.rootMargin);
    isActive$.get();
    normalizeTargets(target);
    if (stoppedRef.current || !mountedRef.current) return;
    setup();
  });

  const pause = () => {
    if (!mountedRef.current) return;
    cleanup();
    isActive$.set(false);
  };

  const resume = () => {
    if (stoppedRef.current || !mountedRef.current) return;
    isActive$.set(true);
    // useObserve detects isActive$ change and calls setup() automatically
  };

  const stop = () => {
    if (!mountedRef.current) return;
    stoppedRef.current = true;
    cleanup();
    isActive$.set(false);
  };

  return {
    isSupported: isSupported$,
    isActive: isActive$,
    stop,
    pause,
    resume,
  };
}
