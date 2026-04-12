import { batch, observable, type Observable } from "@legendapp/state";
import { type DeepMaybeObservable, get, observe, onMount, onUnmount, peek } from "@usels/core";
import { isWindow } from "@usels/core/shared/index";
import { throttle } from "es-toolkit/function";
import type { MaybeEventTarget } from "../../types";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseScrollOptions extends ConfigurableWindow {
  throttle?: number;
  idle?: number;
  onScroll?: (e: Event) => void;
  onStop?: () => void;
  onError?: (error: unknown) => void;
  offset?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  behavior?: ScrollBehavior;
  eventListenerOptions?: AddEventListenerOptions;
}

export interface ArrivedState {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

export interface ScrollDirections {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

export interface UseScrollReturn {
  x$: Observable<number>;
  y$: Observable<number>;
  isScrolling$: Observable<boolean>;
  arrivedState$: Observable<ArrivedState>;
  directions$: Observable<ScrollDirections>;
  measure: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getScrollValues(el: Element | Document | Window | null): {
  x: number;
  y: number;
} {
  if (!el) return { x: 0, y: 0 };
  if (isWindow(el)) return { x: el.scrollX, y: el.scrollY };
  if (el instanceof Document)
    return {
      x: el.documentElement.scrollLeft,
      y: el.documentElement.scrollTop,
    };
  return { x: el.scrollLeft, y: el.scrollTop };
}

function getScrollDimensions(
  el: Element | Document | Window | null,
  win: Window | null | undefined
): {
  scrollW: number;
  scrollH: number;
  clientW: number;
  clientH: number;
} {
  if (!el || isWindow(el)) {
    const doc = win?.document;
    return {
      scrollW: doc?.documentElement.scrollWidth ?? 0,
      scrollH: doc?.documentElement.scrollHeight ?? 0,
      clientW: win?.innerWidth ?? 0,
      clientH: win?.innerHeight ?? 0,
    };
  }
  if (el instanceof Document) {
    const root = el.documentElement;
    return {
      scrollW: root.scrollWidth,
      scrollH: root.scrollHeight,
      clientW: root.clientWidth,
      clientH: root.clientHeight,
    };
  }
  return {
    scrollW: el.scrollWidth,
    scrollH: el.scrollHeight,
    clientW: el.clientWidth,
    clientH: el.clientHeight,
  };
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Framework-agnostic reactive scroll tracker. Monitors `scroll` events on the
 * target (Element, Document, Window, Ref$, or Observable<Element>) and
 * exposes reactive position, direction, arrived-state, and scrolling status.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createScroll(
  element: MaybeEventTarget<Element | Document | Window>,
  options?: DeepMaybeObservable<UseScrollOptions>
): UseScrollReturn {
  const opts$ = observable(options);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- window field type varies by hint map
  const window$ = resolveWindowSource(opts$.window as any);

  const initial = getScrollValues(peek(element) ?? null);

  const x$ = observable<number>(initial.x);
  const y$ = observable<number>(initial.y);
  const isScrolling$ = observable<boolean>(false);
  const arrivedState$ = observable<ArrivedState>({
    left: true,
    right: false,
    top: true,
    bottom: false,
  });
  const directions$ = observable<ScrollDirections>({
    left: false,
    right: false,
    top: false,
    bottom: false,
  });

  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const resetIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    isScrolling$.set(true);
    const idle = (opts$.peek() as UseScrollOptions | undefined)?.idle ?? 200;
    idleTimer = setTimeout(() => {
      isScrolling$.set(false);
      (opts$.peek() as UseScrollOptions | undefined)?.onStop?.();
    }, idle);
  };

  const measure = () => {
    const el = peek(element);
    if (!el) return;

    const prevX = x$.peek();
    const prevY = y$.peek();
    const { x: newX, y: newY } = getScrollValues(el);

    directions$.assign({
      left: newX < prevX,
      right: newX > prevX,
      top: newY < prevY,
      bottom: newY > prevY,
    });

    x$.set(newX);
    y$.set(newY);

    const { scrollW, scrollH, clientW, clientH } = getScrollDimensions(el, window$.peek());
    const maxX = scrollW - clientW;
    const maxY = scrollH - clientH;
    const offset = opts$.peek()?.offset ?? {};

    arrivedState$.assign({
      left: newX <= (offset.left ?? 0),
      right: newX >= maxX - (offset.right ?? 0),
      top: newY <= (offset.top ?? 0),
      bottom: newY >= maxY - (offset.bottom ?? 0),
    });

    resetIdle();
  };

  // Stable handler — throttle state lives in the closure. `opts$.peek()` reads
  // the latest throttle/onScroll each call.
  const rawHandler = (e: Event) => {
    measure();
    opts$.peek()?.onScroll?.(e);
  };
  const rawOpts = opts$.peek();
  const ms = rawOpts?.throttle ?? 0;
  const handler = ms > 0 ? throttle(rawHandler, ms) : rawHandler;

  const listenerOpts = rawOpts?.eventListenerOptions ?? { capture: false, passive: true };
  createEventListener(
    element as MaybeEventTarget,
    "scroll",
    handler,
    listenerOpts as AddEventListenerOptions
  );

  // Reactive: when element transitions to null, reset state and clear timers.
  observe(() => {
    const el = get(element);
    if (!el) {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      batch(() => {
        isScrolling$.set(false);
        x$.set(0);
        y$.set(0);
        arrivedState$.assign({ left: true, right: false, top: true, bottom: false });
        directions$.assign({ left: false, right: false, top: false, bottom: false });
      });
    }
  });

  onMount(() => {
    measure();
  });

  onUnmount(() => {
    if (idleTimer) clearTimeout(idleTimer);
  });

  return {
    x$,
    y$,
    isScrolling$,
    arrivedState$,
    directions$,
    measure,
  };
}
