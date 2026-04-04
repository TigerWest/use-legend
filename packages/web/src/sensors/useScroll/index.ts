"use client";
import { batch, type Observable } from "@legendapp/state";
import { useMount, useObservable, useObserve } from "@legendapp/state/react";
import { useRef } from "react";
import { useLatest } from "@usels/core/shared/useLatest";
import { useConstant } from "@usels/core/shared/useConstant";
import { throttle } from "es-toolkit";
import { type DeepMaybeObservable, get, peek, useMaybeObservable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { isWindow } from "@usels/core/shared/index";
import { useEventListener } from "@browser/useEventListener";
import { type ConfigurableWindow } from "@shared/configurable";
import { useResolvedWindow } from "../../internal/useResolvedWindow";

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
// Hook
// ---------------------------------------------------------------------------

export function useScroll(
  element: MaybeEventTarget<Element | Document | Window>,
  options?: DeepMaybeObservable<UseScrollOptions>
): UseScrollReturn {
  const opts$ = useMaybeObservable(options, {
    onScroll: "function",
    onStop: "function",
    onError: "function",
    window: "element",
  });

  const window$ = useResolvedWindow(opts$.window);

  const initial = getScrollValues(peek(element) ?? null);

  const x$ = useObservable<number>(initial.x);
  const y$ = useObservable<number>(initial.y);
  const isScrolling$ = useObservable<boolean>(false);
  const arrivedState$ = useObservable<ArrivedState>({
    left: true,
    right: false,
    top: true,
    bottom: false,
  });
  const directions$ = useObservable<ScrollDirections>({
    left: false,
    right: false,
    top: false,
    bottom: false,
  });

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdle = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    isScrolling$.set(true);
    idleTimer.current = setTimeout(() => {
      isScrolling$.set(false);
      (opts$.peek()?.onStop as (() => void) | undefined)?.();
    }, opts$.peek()?.idle ?? 200);
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

  const measureRef = useLatest(measure);

  const handler = useConstant(() => {
    const ms = opts$.peek()?.throttle ?? 0;
    const invoke = (e: Event) => {
      measureRef.current();
      opts$.peek()?.onScroll?.(e);
    };
    return ms > 0 ? throttle(invoke, ms) : invoke;
  });

  useEventListener(
    element as MaybeEventTarget,
    "scroll",
    handler,
    opts$.peek()?.eventListenerOptions ?? {
      capture: false,
      passive: true,
    }
  );

  useObserve(() => {
    const el = get(element);
    if (!el) {
      // Element removed — reset scroll state and clear idle timer
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
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

  useMount(() => {
    measure();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
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
