import { ObservableHint, observable, type Observable, type OpaqueObject } from "@legendapp/state";
import { peek, type DeepMaybeObservable } from "@usels/core";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createResizeObserver } from "../useResizeObserver/core";
import { createMutationObserver } from "../useMutationObserver/core";
import { createEventListener } from "../../browser/useEventListener/core";

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
 * Framework-agnostic mouse-in-element tracker. Must be called inside a
 * `useScope` factory — `mousemove`, `mouseleave`, window scroll/resize
 * listeners as well as ResizeObserver / MutationObserver for the target are
 * all registered via the scope-aware `create*` helpers and cleaned up
 * automatically when the scope disposes. Public API matches the legacy
 * `useMouseInElement` hook.
 */
export function createMouseInElement(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseMouseInElementOptions>
): UseMouseInElementReturn {
  const opts$ = observable(options) as unknown as Observable<UseMouseInElementOptions>;

  // Mount-time toggles — these gate whether the scroll / resize listeners
  // are registered at all; they are not expected to flip after mount.
  const peeked = opts$.peek() ?? {};
  const windowScroll = peeked.windowScroll !== false;
  const windowResize = peeked.windowResize !== false;

  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);
  const doc$ = observable<OpaqueObject<Document> | null>(() => {
    const win = win$.get();
    return win?.document ? ObservableHint.opaque(win.document) : null;
  });

  // Global mouse coordinates (exposed in return)
  const mouse$ = observable({ x: 0, y: 0 });

  // Element-relative state
  const state$ = observable({
    elementX: 0,
    elementY: 0,
    elementPositionX: 0,
    elementPositionY: 0,
    elementWidth: 0,
    elementHeight: 0,
    isOutside: true,
  });

  // Recalculate element-relative position from current mouse coords.
  const update = () => {
    const el = peek(target) as HTMLElement | null;
    if (!el || !(el instanceof Element)) {
      state$.isOutside.set(true);
      return;
    }

    const rects = Array.from(el.getClientRects());
    if (!rects.length) return;

    const mx = mouse$.x.peek();
    const my = mouse$.y.peek();
    const win = win$.peek();
    let found = false;

    for (const rect of rects) {
      if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
        state$.assign({
          elementX: mx - rect.left,
          elementY: my - rect.top,
          elementPositionX: rect.left + (win?.scrollX ?? 0),
          elementPositionY: rect.top + (win?.scrollY ?? 0),
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
      if (opts$.peek()?.handleOutside !== false) {
        const rect = rects[0];
        state$.assign({
          elementX: mx - rect.left,
          elementY: my - rect.top,
          elementPositionX: rect.left + (win?.scrollX ?? 0),
          elementPositionY: rect.top + (win?.scrollY ?? 0),
          elementWidth: rect.width,
          elementHeight: rect.height,
        });
      }
    }
  };

  // Update global mouse coords then recalculate element-relative state.
  const onMouseMove = (e: MouseEvent) => {
    mouse$.assign({ x: e.clientX, y: e.clientY });
    update();
  };

  const stopMouse = createEventListener(
    win$ as unknown as Observable<unknown>,
    "mousemove",
    onMouseMove,
    { passive: true }
  );

  // document mouseleave → force isOutside = true
  const stopLeave = createEventListener(doc$ as unknown as Observable<unknown>, "mouseleave", () =>
    state$.isOutside.set(true)
  );

  const stopScroll = createEventListener(
    windowScroll ? (win$ as unknown as Observable<unknown>) : null,
    "scroll",
    update,
    { passive: true }
  );
  const stopResize = createEventListener(
    windowResize ? (win$ as unknown as Observable<unknown>) : null,
    "resize",
    update,
    { passive: true }
  );

  // Observe element size changes
  const { stop: stopRO } = createResizeObserver(target, update);

  // Observe style/class attribute changes (e.g. CSS transitions, class toggles)
  const { stop: stopMO } = createMutationObserver(target, update, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  const stop = () => {
    stopMouse();
    stopLeave();
    stopScroll();
    stopResize();
    stopRO();
    stopMO();
  };

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
