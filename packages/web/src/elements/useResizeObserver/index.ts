import { useObservable, useObserveEffect, useUnmount } from "@legendapp/state/react";
import { useRef } from "react";
import { useLatest } from "@usels/core/shared/useLatest";
import { normalizeTargets } from "@usels/core/shared/normalizeTargets/index";
import { MaybeElement, type Supportable } from "@usels/core";

export { normalizeTargets } from "@usels/core/shared/normalizeTargets/index";

export interface UseResizeObserverOptions {
  box?: "content-box" | "border-box" | "device-pixel-content-box";
}

export interface UseResizeObserverReturn extends Supportable {
  stop: () => void;
}

/**
 * Observes one or more elements for size changes using the ResizeObserver API.
 *
 * @param target - Element(s) to observe: Ref$, Observable<Element|null>, plain Element, or an array
 * @param callback - ResizeObserver callback. Wrap in `useCallback` to avoid stale closures —
 *   the observer is only recreated when targets change, not on every render.
 * @param options - Optional box model option. Note: dynamic `box` changes are not reactively
 *   tracked; remount the hook or change a tracked target to pick up a new box value.
 * @returns `{ isSupported$, stop }` — reactive support flag and manual stop function
 *
 * @example
 * ```tsx
 * const el$ = useRef$<HTMLDivElement>();
 * const handleResize = useCallback<ResizeObserverCallback>((entries) => {
 *   const { width, height } = entries[0].contentRect;
 *   width$.set(width);
 * }, []);
 * useResizeObserver(el$, handleResize);
 * return <div ref={el$} />;
 * ```
 */
export function useResizeObserver(
  target: MaybeElement | MaybeElement[],
  callback: ResizeObserverCallback,
  options?: UseResizeObserverOptions
): UseResizeObserverReturn {
  const isSupported$ = useObservable<boolean>(typeof ResizeObserver !== "undefined");
  const observerRef = useRef<ResizeObserver | null>(null);

  // Always use the latest callback without recreating the observer on every render.
  const callbackRef = useLatest(callback);

  // Always use the latest options in setup() without reactive tracking.
  const optionsRef = useLatest(options);

  const cleanup = () => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  };

  const setup = () => {
    if (!isSupported$.peek()) return;
    cleanup();

    const targets = normalizeTargets(target).filter((el): el is Element => el instanceof Element);
    if (!targets.length) return;

    observerRef.current = new ResizeObserver((...args) => callbackRef.current(...args));
    targets.forEach((el) => {
      observerRef.current!.observe(el, { box: optionsRef.current?.box });
    });
  };

  // Setup after DOM commit; re-run and cleanup when observable targets change.
  useObserveEffect((e) => {
    e.onCleanup = cleanup;
    normalizeTargets(target); // registers reactive dep for Ref$/Observable targets
    setup();
  });

  // Explicit unmount cleanup — useObserveEffect's onCleanup only fires on
  // reactive re-runs, not guaranteed on React unmount.
  useUnmount(cleanup);

  return { isSupported$, stop: cleanup };
}
