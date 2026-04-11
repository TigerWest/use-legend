import { createSupported, observe, onUnmount } from "@usels/core";
import { normalizeTargets } from "@shared/normalizeTargets";
import type { DeepMaybeObservable, Supportable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { get } from "@usels/core";

export interface UseResizeObserverOptions {
  box?: "content-box" | "border-box" | "device-pixel-content-box";
}

export interface UseResizeObserverReturn extends Supportable {
  stop: () => void;
}

export function createResizeObserver(
  target: MaybeEventTarget | MaybeEventTarget[],
  callback: ResizeObserverCallback,
  options?: DeepMaybeObservable<UseResizeObserverOptions>
): UseResizeObserverReturn {
  const isSupported$ = createSupported(() => typeof ResizeObserver !== "undefined");
  let observer: ResizeObserver | null = null;

  const cleanup = () => {
    observer?.disconnect();
    observer = null;
  };

  observe(() => {
    cleanup();
    if (!isSupported$.get()) return;

    const targets = normalizeTargets(target).filter((el): el is Element => el instanceof Element);
    if (!targets.length) return;

    observer = new ResizeObserver(callback);
    targets.forEach((el) => {
      observer!.observe(el, { box: get(options)?.box });
    });
  });

  onUnmount(cleanup);

  return { isSupported$, stop: cleanup };
}
