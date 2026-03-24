"use client";
import { useObservable, useObserve } from "@legendapp/state/react";
import type { Observable } from "@legendapp/state";
import { useCallback, useRef } from "react";
import { type MaybeElement, getElement } from "@usels/core";
import { useUnmount } from "@usels/core/shared/index";
import type { MaybeObservable } from "@usels/core";
import { defaultDocument, defaultWindow } from "@shared/configurable";
import { useEventListener } from "@browser/useEventListener";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseScrollLockReturn {
  /** Current scroll lock state */
  isLocked$: Observable<boolean>;
  /** Lock scrolling */
  lock: () => void;
  /** Unlock scrolling */
  unlock: () => void;
  /** Toggle lock state */
  toggle: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getScrollbarWidth(): number {
  if (!defaultDocument || !defaultWindow) return 0;
  return defaultWindow.innerWidth - defaultDocument.documentElement.clientWidth;
}

function resolveInitialValue(initialState?: MaybeObservable<boolean>): boolean {
  if (initialState == null) return false;
  if (typeof initialState === "boolean") return initialState;
  if (typeof initialState === "object" && "peek" in initialState) {
    return (initialState as Observable<boolean>).peek();
  }
  return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useScrollLock(
  element?: MaybeElement,
  initialState?: MaybeObservable<boolean>
): UseScrollLockReturn {
  const isLocked$ = useObservable<boolean>(resolveInitialValue(initialState));
  const savedOverflow = useRef<string>("");
  const savedPaddingRight = useRef<string>("");
  const lockedElement = useRef<HTMLElement | null>(null);

  const applyLock = useCallback((el: HTMLElement) => {
    if (lockedElement.current === el) return;
    // If locked on a different element, restore it first
    if (lockedElement.current) {
      lockedElement.current.style.overflow = savedOverflow.current;
      lockedElement.current.style.paddingRight = savedPaddingRight.current;
    }
    savedOverflow.current = el.style.overflow;
    savedPaddingRight.current = el.style.paddingRight;

    const scrollbarWidth = getScrollbarWidth();
    el.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      el.style.paddingRight = `${scrollbarWidth}px`;
    }
    lockedElement.current = el;
  }, []);

  const removeLock = useCallback(() => {
    if (!lockedElement.current) return;
    lockedElement.current.style.overflow = savedOverflow.current;
    lockedElement.current.style.paddingRight = savedPaddingRight.current;
    lockedElement.current = null;
  }, []);

  const lock = useCallback(() => {
    isLocked$.set(true);
  }, []);

  const unlock = useCallback(() => {
    isLocked$.set(false);
  }, []);

  const toggle = useCallback(() => {
    isLocked$.set((v) => !v);
  }, []);

  // React to isLocked$ changes and element lifecycle
  useObserve(() => {
    const el = getElement(element) as HTMLElement | null;
    const hasExplicitElement = element != null;
    const target = hasExplicitElement ? el : (el ?? defaultDocument?.body ?? null);
    const locked = isLocked$.get();

    if (locked && target) {
      applyLock(target);
    } else {
      removeLock();
    }
  });

  // iOS Safari: prevent touchmove when locked
  const onTouchMove = useCallback((e: TouchEvent) => {
    if (isLocked$.peek()) e.preventDefault();
  }, []);

  useEventListener(element ?? defaultDocument, "touchmove", onTouchMove, { passive: false });

  useUnmount(() => {
    removeLock();
  });

  return { isLocked$, lock, unlock, toggle };
}
