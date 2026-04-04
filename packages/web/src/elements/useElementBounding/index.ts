import type { Observable } from "@legendapp/state";
import { useObservable, useObserveEffect, useUnmount } from "@legendapp/state/react";
import { useCallback, useRef } from "react";
import { peek } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { normalizeTargets } from "@shared/normalizeTargets";
import { useResizeObserver } from "@elements/useResizeObserver";
import { useMutationObserver } from "@elements/useMutationObserver";
import { useEventListener } from "@browser/useEventListener";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";
import { useMaybeObservable, type DeepMaybeObservable } from "@usels/core";

export interface UseElementBoundingOptions extends ConfigurableWindow {
  /** Reset all values to 0 when element unmounts. Default: true */
  reset?: boolean;
  /** Re-calculate on window resize. Default: true */
  windowResize?: boolean;
  /** Re-calculate on window scroll. Default: true */
  windowScroll?: boolean;
  /** Calculate immediately on mount. Default: true */
  immediate?: boolean;
  /** Use requestAnimationFrame to read rect after CSS transforms settle. Default: true */
  useCssTransforms?: boolean;
}

export interface UseElementBoundingReturn {
  x$: Observable<number>;
  y$: Observable<number>;
  top$: Observable<number>;
  right$: Observable<number>;
  bottom$: Observable<number>;
  left$: Observable<number>;
  width$: Observable<number>;
  height$: Observable<number>;
  update: () => void;
}

const ZERO = {
  x: 0,
  y: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
};

/**
 * Tracks the bounding rect of a DOM element (x, y, top, right, bottom, left, width, height).
 * Observes ResizeObserver, MutationObserver (style/class changes), window scroll, and resize.
 *
 * @param target - Element to observe: Ref$, Observable<OpaqueObject<Element>|null>, Document, Window, or null
 * @param options - Configuration options
 * @returns Reactive bounding rect values plus a manual `update()` function
 *
 * @example
 * ```tsx
 * const el$ = useRef$<HTMLDivElement>();
 * const { top$, left$, width$, height$ } = useElementBounding(el$);
 * return <div ref={el$} />;
 * ```
 */
export function useElementBounding(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseElementBoundingOptions>
): UseElementBoundingReturn {
  const opts$ = useMaybeObservable<UseElementBoundingOptions>(options, { window: "element" });
  const window$ = useResolvedWindow(opts$.window);

  const bounding$ = useObservable({ ...ZERO });

  // Guards rAF callbacks from updating state after unmount.
  const unmountedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const recalculate = useCallback(() => {
    const el = peek(target) as Element | null;
    if (!el || !(el instanceof Element)) {
      if (opts$.reset.peek() !== false) bounding$.assign({ ...ZERO });
      return;
    }
    const rect = el.getBoundingClientRect();
    bounding$.assign({
      x: rect.x,
      y: rect.y,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  const update = useCallback(() => {
    if (opts$.useCssTransforms.peek() !== false) {
      rafRef.current = requestAnimationFrame(() => {
        if (!unmountedRef.current) recalculate();
      });
    } else {
      recalculate();
    }
  }, [recalculate]);

  // Observe size changes
  useResizeObserver(target, update);

  // Observe style/class attribute changes (e.g. CSS transitions, class toggles)
  useMutationObserver(target, update, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  // Observe window scroll / resize (always call hooks unconditionally — Rules of Hooks)
  // peek() — evaluated once at render time, no reactive subscription needed.
  useEventListener(opts$.windowScroll.peek() !== false ? window$ : null, "scroll", update, {
    passive: true,
  });
  useEventListener(opts$.windowResize.peek() !== false ? window$ : null, "resize", update, {
    passive: true,
  });

  useObserveEffect(() => {
    normalizeTargets(target); // register reactive dep
    update();
  });
  useUnmount(() => {
    unmountedRef.current = true;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (opts$.reset.peek() !== false) bounding$.assign({ ...ZERO });
  });

  return {
    x$: bounding$.x,
    y$: bounding$.y,
    top$: bounding$.top,
    right$: bounding$.right,
    bottom$: bounding$.bottom,
    left$: bounding$.left,
    width$: bounding$.width,
    height$: bounding$.height,
    update,
  };
}
