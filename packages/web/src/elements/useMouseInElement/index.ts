import type { Observable, OpaqueObject } from "@legendapp/state";
import { ObservableHint } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { useCallback } from "react";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useMaybeObservable, type DeepMaybeObservable } from "@usels/core";
import { type MaybeElement, peekElement } from "@usels/core";
import { useResizeObserver } from "@elements/useResizeObserver";
import { useMutationObserver } from "@elements/useMutationObserver";
import { useEventListener } from "@browser/useEventListener";

export interface UseMouseInElementOptions extends ConfigurableWindow {
  /** Also update elementX/Y when mouse is outside the element. Default: true */
  handleOutside?: boolean;
  /** Re-calculate on window scroll. Default: true */
  windowScroll?: boolean;
  /** Re-calculate on window resize. Default: true */
  windowResize?: boolean;
}

export interface UseMouseInElementReturn {
  /** Mouse X position relative to the element */
  elementX$: Observable<number>;
  /** Mouse Y position relative to the element */
  elementY$: Observable<number>;
  /** Element's absolute X position on the page */
  elementPositionX$: Observable<number>;
  /** Element's absolute Y position on the page */
  elementPositionY$: Observable<number>;
  /** Element width */
  elementWidth$: Observable<number>;
  /** Element height */
  elementHeight$: Observable<number>;
  /** Whether the mouse is outside the element */
  isOutside$: Observable<boolean>;
  /** Global mouse X (clientX) */
  x$: Observable<number>;
  /** Global mouse Y (clientY) */
  y$: Observable<number>;
  /** Stop all observers and event listeners */
  stop: () => void;
}

/**
 * Tracks whether the mouse cursor is inside a DOM element and calculates
 * the cursor position relative to that element.
 *
 * Observes mousemove, document mouseleave, ResizeObserver, MutationObserver
 * (style/class changes), window scroll, and resize.
 *
 * @param target - Element to observe: Ref$, Observable<OpaqueObject<Element>|null>, Document, Window, or null
 * @param options - Configuration options
 * @returns Reactive mouse position values relative to the element, plus a manual `stop()` function
 *
 * @example
 * ```tsx
 * const el$ = useRef$<HTMLDivElement>();
 * const { elementX$, elementY$, isOutside$ } = useMouseInElement(el$);
 * return <div ref={el$} />;
 * ```
 */
export function useMouseInElement(
  target: MaybeElement,
  options?: DeepMaybeObservable<UseMouseInElementOptions>
): UseMouseInElementReturn {
  const opts$ = useMaybeObservable<UseMouseInElementOptions>(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);
  const doc$ = useObservable<OpaqueObject<Document> | null>(() => {
    const doc = window$.get()?.document;
    return doc ? ObservableHint.opaque(doc) : null;
  });

  // Global mouse coordinates (exposed in return)
  const mouse$ = useObservable({ x: 0, y: 0 });

  // Element-relative state
  const state$ = useObservable({
    elementX: 0,
    elementY: 0,
    elementPositionX: 0,
    elementPositionY: 0,
    elementWidth: 0,
    elementHeight: 0,
    isOutside: true,
  });

  // Recalculate element-relative position from current mouse coords
  const update = useCallback(() => {
    const el = peekElement(target) as HTMLElement | null;
    if (!el || !(el instanceof Element)) {
      state$.isOutside.set(true);
      return;
    }

    const rects = Array.from(el.getClientRects());
    if (!rects.length) return;

    const mx = mouse$.x.peek();
    const my = mouse$.y.peek();
    let found = false;

    for (const rect of rects) {
      if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
        state$.assign({
          elementX: mx - rect.left,
          elementY: my - rect.top,
          elementPositionX: rect.left + (window$.peek()?.scrollX ?? 0),
          elementPositionY: rect.top + (window$.peek()?.scrollY ?? 0),
          elementWidth: rect.width,
          elementHeight: rect.height,
          isOutside: false,
        });
        found = true;
        break;
      }
    }

    if (!found) {
      state$.isOutside.set(true);
      if (opts$.handleOutside.peek() !== false) {
        const rect = rects[0];
        state$.assign({
          elementX: mx - rect.left,
          elementY: my - rect.top,
          elementPositionX: rect.left + (window$.peek()?.scrollX ?? 0),
          elementPositionY: rect.top + (window$.peek()?.scrollY ?? 0),
          elementWidth: rect.width,
          elementHeight: rect.height,
        });
      }
    }
  }, []);

  // Update global mouse coords then recalculate
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      mouse$.assign({ x: e.clientX, y: e.clientY });
      update();
    },
    [update]
  );

  const stopMouse = useEventListener(window$, "mousemove", onMouseMove, {
    passive: true,
  });

  // document mouseleave → force isOutside = true
  const stopLeave = useEventListener(doc$, "mouseleave", () => state$.isOutside.set(true));

  const stopScroll = useEventListener(
    opts$.windowScroll.peek() !== false ? window$ : null,
    "scroll",
    update,
    { passive: true }
  );
  const stopResize = useEventListener(
    opts$.windowResize.peek() !== false ? window$ : null,
    "resize",
    update,
    { passive: true }
  );

  // Observe element size changes
  const { stop: stopRO } = useResizeObserver(target, update);

  // Observe style/class attribute changes (e.g. CSS transitions, class toggles)
  const { stop: stopMO } = useMutationObserver(target, update, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  const stop = useCallback(() => {
    stopMouse();
    stopLeave();
    stopScroll();
    stopResize();
    stopRO();
    stopMO();
  }, []);

  return {
    elementX$: state$.elementX,
    elementY$: state$.elementY,
    elementPositionX$: state$.elementPositionX,
    elementPositionY$: state$.elementPositionY,
    elementWidth$: state$.elementWidth,
    elementHeight$: state$.elementHeight,
    isOutside$: state$.isOutside,
    x$: mouse$.x,
    y$: mouse$.y,
    stop,
  };
}
