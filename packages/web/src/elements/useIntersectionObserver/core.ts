import { observable } from "@legendapp/state";
import { createSupported, observe, onUnmount, get } from "@usels/core";
import { normalizeTargets } from "@shared/normalizeTargets";
import { isWindow } from "@usels/core/shared/index";
import type { DeepMaybeObservable, ReadonlyObservable, Supportable, Pausable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";

export interface UseIntersectionObserverOptions {
  /** Whether to start observing immediately on mount. Default: true */
  immediate?: boolean;
  /** The element or document used as the viewport. Default: browser viewport */
  root?: MaybeEventTarget;
  /** Margin around the root. Accepts CSS-style values. Default: "0px" */
  rootMargin?: string;
  /** Threshold(s) at which to trigger the callback. Default: 0 */
  threshold?: number | number[];
}

export interface UseIntersectionObserverReturn extends Supportable, Pausable {
  stop: () => void;
}

export function createIntersectionObserver(
  target: MaybeEventTarget | MaybeEventTarget[],
  callback: IntersectionObserverCallback,
  options?: DeepMaybeObservable<UseIntersectionObserverOptions>
): UseIntersectionObserverReturn {
  const opts$ = observable(options);
  const isSupported$ = createSupported(() => typeof IntersectionObserver !== "undefined");
  const isActive$ = observable<boolean>(opts$.peek()?.immediate !== false);
  let observer: IntersectionObserver | null = null;
  let stopped = false;

  const cleanup = () => {
    observer?.disconnect();
    observer = null;
  };

  observe(() => {
    const raw = opts$.get();
    const rawRoot = get(raw?.root);
    const rootMargin = get(raw?.rootMargin) as string | undefined;
    const threshold = get(raw?.threshold) as number | number[] | undefined;
    const active = isActive$.get();
    normalizeTargets(target); // register reactive dep for target changes

    cleanup();
    if (stopped || !isSupported$.get() || !active) return;

    if (rawRoot === null) return;
    const effectiveRoot: Element | Document | undefined =
      rawRoot === undefined
        ? undefined
        : isWindow(rawRoot as unknown)
          ? undefined // window → treat as viewport
          : (rawRoot as unknown as Element | Document);

    const targets = normalizeTargets(target).filter((el): el is Element => el instanceof Element);
    if (!targets.length) return;

    observer = new IntersectionObserver(callback, {
      root: effectiveRoot,
      rootMargin: rootMargin as string | undefined,
      threshold: (threshold as number | number[] | undefined) ?? 0,
    });
    targets.forEach((el) => observer?.observe(el));
  });

  onUnmount(cleanup);

  const pause = () => {
    cleanup();
    isActive$.set(false);
  };

  const resume = () => {
    if (stopped) return;
    isActive$.set(true);
  };

  const stop = () => {
    stopped = true;
    cleanup();
    isActive$.set(false);
  };

  return {
    isSupported$,
    isActive$: isActive$ as ReadonlyObservable<boolean>,
    pause,
    resume,
    stop,
  };
}
