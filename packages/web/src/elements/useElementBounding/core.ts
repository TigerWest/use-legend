import { observable, type Observable } from "@legendapp/state";
import {
  createSupported,
  createObserve,
  onUnmount,
  peek,
  type DeepMaybeObservable,
} from "@usels/core";
import { normalizeTargets } from "@shared/normalizeTargets";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import type { MaybeEventTarget } from "../../types";
import { createResizeObserver } from "../useResizeObserver/core";
import { createMutationObserver } from "../useMutationObserver/core";
import { createEventListener } from "../../browser/useEventListener/core";

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
 * Framework-agnostic bounding-rect tracker. Must be called inside a `useScope`
 * factory — ResizeObserver / MutationObserver / window listeners are registered
 * via the scope-aware `create*` helpers and are cleaned up automatically when
 * the scope disposes. Public API matches the legacy `useElementBounding` hook.
 */
export function createElementBounding(
  target: MaybeEventTarget,
  options?: DeepMaybeObservable<UseElementBoundingOptions>
): UseElementBoundingReturn {
  const opts$ = observable(options) as unknown as Observable<UseElementBoundingOptions>;

  // Mount-time toggles — these do not need to be reactive: they gate whether
  // the window scroll/resize listeners and reset behavior are enabled at all.
  const peeked = opts$.peek() ?? {};
  const reset = peeked.reset !== false;
  const windowScroll = peeked.windowScroll !== false;
  const windowResize = peeked.windowResize !== false;

  const win$ = resolveWindowSource(opts$.window as unknown as Observable<unknown>);

  // SSR / mount gate — `createSupported` stays `false` until `onBeforeMount`
  // fires (client-side useLayoutEffect), then flips `true` only if a window
  // with `requestAnimationFrame` is actually available. Used to guard all
  // DOM reads and rAF scheduling so they never run during SSR render.
  const isSupported$ = createSupported(() => {
    const win = win$.peek();
    return !!win && typeof win.requestAnimationFrame === "function";
  });

  const bounding$ = observable({ ...ZERO });

  // Guards rAF callbacks from updating state after unmount.
  let unmounted = false;
  let rafHandle: number | null = null;

  const recalculate = () => {
    if (unmounted) return;
    const el = peek(target) as Element | null;
    if (!el || !(el instanceof Element)) {
      if (reset) bounding$.assign({ ...ZERO });
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
  };

  const update = () => {
    // SSR guard — before onBeforeMount fires, `isSupported$` is false.
    if (!isSupported$.peek()) return;
    const win = win$.peek();
    if (!win) return;
    if (opts$.peek()?.useCssTransforms !== false) {
      rafHandle = win.requestAnimationFrame(() => {
        if (!unmounted) recalculate();
      });
    } else {
      recalculate();
    }
  };

  // Observe element size changes
  createResizeObserver(target, update);

  // Observe style/class attribute changes (e.g. CSS transitions, class toggles)
  createMutationObserver(target, update, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  // Observe window scroll / resize — gate at mount time so passing null
  // skips the listener entirely when the corresponding toggle is false.
  createEventListener(
    windowScroll ? (win$ as unknown as Observable<unknown>) : null,
    "scroll",
    update,
    { passive: true }
  );
  createEventListener(
    windowResize ? (win$ as unknown as Observable<unknown>) : null,
    "resize",
    update,
    { passive: true }
  );

  // React to target changes (register element as reactive dep via
  // normalizeTargets) AND react to mount state (`isSupported$`) flipping true
  // on onBeforeMount — which is how the initial post-mount read is scheduled
  // without touching DOM / rAF during SSR render.
  createObserve(() => {
    if (!isSupported$.get()) return;
    normalizeTargets(target);
    update();
  });

  onUnmount(() => {
    unmounted = true;
    if (rafHandle !== null) {
      win$.peek()?.cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
    if (reset) bounding$.assign({ ...ZERO });
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
