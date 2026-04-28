import { observable, type Observable } from "@legendapp/state";
import { get, createObserve, type DeepMaybeObservable } from "@usels/core";
import { createResizeObserver } from "@elements/useResizeObserver/core";
import type { MaybeEventTarget } from "../../types";

export interface UseElementSizeOptions {
  box?: "content-box" | "border-box" | "device-pixel-content-box";
}

export interface UseElementSizeReturn {
  width$: Observable<number>;
  height$: Observable<number>;
  stop: () => void;
}

/**
 * Framework-agnostic reactive element size tracker.
 *
 * Tracks the width and height of a DOM element using `ResizeObserver`.
 * SVG elements use `getBoundingClientRect()` as fallback.
 *
 * @param target - Element to observe (Ref$, Observable element, Document, Window, or null).
 * @param initialSize - Initial size values. Default `{ width: 0, height: 0 }`.
 * @param options - Optional box model option.
 * @returns `{ width$, height$, stop }` — reactive size observables and manual stop.
 */
export function createElementSize(
  target: MaybeEventTarget,
  initialSize?: { width: number; height: number },
  options?: DeepMaybeObservable<UseElementSizeOptions>
): UseElementSizeReturn {
  const initial = initialSize ?? { width: 0, height: 0 };
  const size$ = observable({ width: initial.width, height: initial.height });
  const opts$ = observable(options);

  const onResize: ResizeObserverCallback = (entries) => {
    for (const entry of entries) {
      const el = entry.target;
      const isSvg = (el as Element).namespaceURI?.includes("svg");

      if (isSvg) {
        const rect = el.getBoundingClientRect();
        size$.assign({ width: rect.width, height: rect.height });
      } else {
        const box = opts$.peek()?.box ?? "content-box";
        let w = 0;
        let h = 0;
        if (box === "border-box" && entry.borderBoxSize?.length) {
          for (const b of entry.borderBoxSize) {
            w += b.inlineSize;
            h += b.blockSize;
          }
        } else if (box === "device-pixel-content-box" && entry.devicePixelContentBoxSize?.length) {
          for (const b of entry.devicePixelContentBoxSize) {
            w += b.inlineSize;
            h += b.blockSize;
          }
        } else if (entry.contentBoxSize?.length) {
          for (const b of entry.contentBoxSize) {
            w += b.inlineSize;
            h += b.blockSize;
          }
        } else {
          w = entry.contentRect.width;
          h = entry.contentRect.height;
        }
        size$.assign({ width: w, height: h });
      }
    }
  };

  const { stop } = createResizeObserver(target, onResize, options);

  // Sync initial size from offsetWidth/offsetHeight after element mounts.
  // Re-runs when `target` (Ref$/Observable) changes.
  createObserve(() => {
    const el = get(target) as HTMLElement | null;
    if (!el) {
      size$.assign({ width: initial.width, height: initial.height });
      return;
    }
    const isSvg = (el as Element).namespaceURI?.includes("svg");
    if (!isSvg) {
      size$.assign({
        width: (el as HTMLElement).offsetWidth ?? initial.width,
        height: (el as HTMLElement).offsetHeight ?? initial.height,
      });
    }
  });

  return { width$: size$.width, height$: size$.height, stop };
}
