import type { Observable } from "@legendapp/state";
import { useObservable, useObserveEffect } from "@legendapp/state/react";
import { useCallback } from "react";
import { getElement, MaybeElement } from "../useEl$";
import { useResizeObserver } from "../useResizeObserver";

export interface UseElementSizeOptions {
  box?: "content-box" | "border-box" | "device-pixel-content-box";
}

export interface UseElementSizeReturn {
  width: Observable<number>;
  height: Observable<number>;
  stop: () => void;
}

/**
 * Tracks the width and height of a DOM element using ResizeObserver.
 * SVG elements use getBoundingClientRect() as fallback.
 *
 * @param target - Element to observe (El$, Observable<Element|null>, Document, Window, or null)
 * @param initialSize - Initial size values (default: { width: 0, height: 0 })
 * @param options - Optional box model option
 * @returns `{ width, height, stop }` — reactive size observables and manual stop function
 *
 * @example
 * ```tsx
 * const el$ = useEl$<HTMLDivElement>();
 * const { width, height } = useElementSize(el$);
 * return <div ref={el$}>{width.get()} x {height.get()}</div>;
 * ```
 */
export function useElementSize(
  target: MaybeElement,
  initialSize?: { width: number; height: number },
  options?: UseElementSizeOptions,
): UseElementSizeReturn {
  const initial = initialSize ?? { width: 0, height: 0 };
  const size$ = useObservable({ width: initial.width, height: initial.height });

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      const isSvg = (el as Element).namespaceURI?.includes("svg");

      if (isSvg) {
        const rect = el.getBoundingClientRect();
        size$.assign({ width: rect.width, height: rect.height });
      } else {
        const box = options?.box ?? "content-box";
        let w = 0,
          h = 0;
        if (box === "border-box" && entry.borderBoxSize?.length) {
          for (const b of entry.borderBoxSize) {
            w += b.inlineSize;
            h += b.blockSize;
          }
        } else if (
          box === "device-pixel-content-box" &&
          entry.devicePixelContentBoxSize?.length
        ) {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { stop } = useResizeObserver(target, onResize, { box: options?.box });

  // Set initial size from offsetWidth/Height after element mounts.
  // Uses getElement (tracked) so this re-runs when target El$ changes.
  useObserveEffect(() => {
    const el = getElement(target) as HTMLElement | null;
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

  return { width: size$.width, height: size$.height, stop };
}
