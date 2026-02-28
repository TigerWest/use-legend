"use client";
import type { Observable } from "@legendapp/state";
import { useMount, useObservable } from "@legendapp/state/react";
import { useMemo, useRef } from "react";
import { throttle } from "es-toolkit";
import { type MaybeElement, peekElement } from "../../elements/useRef$";
import { isWindow } from "../../shared";
import type { MaybeObservable } from "../../types";
import { useEventListener } from "../../browser/useEventListener";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseScrollOptions {
  throttle?: number;
  idle?: number;
  onStop?: () => void;
  onError?: (error: unknown) => void;
  offset?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  behavior?: ScrollBehavior;
  eventListenerOptions?: MaybeObservable<AddEventListenerOptions>;
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

function getScrollValues(el: HTMLElement | Document | Window | null): {
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

function getScrollDimensions(el: HTMLElement | Document | Window | null): {
  scrollW: number;
  scrollH: number;
  clientW: number;
  clientH: number;
} {
  if (!el || isWindow(el)) {
    return {
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
      clientW: window.innerWidth,
      clientH: window.innerHeight,
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
  element: MaybeElement,
  options?: UseScrollOptions,
): UseScrollReturn {
  const initial = getScrollValues(peekElement(element));

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
      options?.onStop?.();
    }, options?.idle ?? 200);
  };

  const measure = () => {
    const el = peekElement(element);
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

    const { scrollW, scrollH, clientW, clientH } = getScrollDimensions(el);
    const maxX = scrollW - clientW;
    const maxY = scrollH - clientH;
    const offset = options?.offset ?? {};

    arrivedState$.assign({
      left: newX <= (offset.left ?? 0),
      right: newX >= maxX - (offset.right ?? 0),
      top: newY <= (offset.top ?? 0),
      bottom: newY >= maxY - (offset.bottom ?? 0),
    });

    resetIdle();
  };

  const measureRef = useRef(measure);
  measureRef.current = measure;

  const handler = useMemo(() => {
    const ms = options?.throttle ?? 0;
    return ms > 0
      ? throttle(() => measureRef.current(), ms)
      : () => measureRef.current();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEventListener(element as any, "scroll", handler,
    options?.eventListenerOptions ?? { capture: false, passive: true },
  );

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
