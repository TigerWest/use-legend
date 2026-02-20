import type { Observable } from "@legendapp/state";
import { useObservable, useObserve } from "@legendapp/state/react";
import { useEffect, useRef } from "react";
import { get } from "../../function/get";
import type { MaybeObservable } from "../../types";
import type { El$ } from "../useEl$";
import { normalizeTargets } from "../useResizeObserver";

export interface UseIntersectionObserverOptions {
  /** Whether to start observing immediately on mount. Default: true */
  immediate?: boolean;
  /** The element or document used as the viewport. Default: browser viewport */
  root?: MaybeObservable<HTMLElement | Document | null>;
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

type IntersectionTarget = El$<Element> | MaybeObservable<Element | null>;

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
  target: IntersectionTarget | IntersectionTarget[],
  callback: IntersectionObserverCallback,
  options?: UseIntersectionObserverOptions,
): UseIntersectionObserverReturn {
  const isSupported$ = useObservable<boolean>(
    typeof IntersectionObserver !== "undefined",
  );
  const isActive$ = useObservable<boolean>(options?.immediate !== false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const stoppedRef = useRef(false);

  const cleanup = () => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  };

  const setup = () => {
    if (!isSupported$.peek() || !isActive$.peek()) return;

    cleanup();

    const root = options?.root !== undefined ? get(options.root) : undefined;
    const rootMargin =
      options?.rootMargin !== undefined ? get(options.rootMargin) : undefined;

    observerRef.current = new IntersectionObserver(callback, {
      root: root ?? undefined,
      rootMargin,
      threshold: options?.threshold ?? 0,
    });

    const targets = normalizeTargets(target);
    targets.forEach((el) => observerRef.current?.observe(el));
  };

  // Re-run setup when reactive options (root, rootMargin) or isActive$ changes.
  // setup() internally calls cleanup() before creating a new observer.
  useObserve(() => {
    if (stoppedRef.current) return;
    if (options?.root !== undefined) get(options.root);
    if (options?.rootMargin !== undefined) get(options.rootMargin);
    isActive$.get();
    setup();
  });

  // Disconnect observer on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => cleanup(), []);

  const pause = () => {
    cleanup();
    isActive$.set(false);
  };

  const resume = () => {
    if (stoppedRef.current) return;
    isActive$.set(true);
    // useObserve detects isActive$ change and calls setup() automatically
  };

  const stop = () => {
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
