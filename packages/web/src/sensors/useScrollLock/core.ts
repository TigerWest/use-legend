import { observable, ObservableHint, type Observable, type OpaqueObject } from "@legendapp/state";
import { type DeepMaybeObservable, get, createObserve, onUnmount } from "@usels/core";
import type { MaybeObservable } from "@usels/core";
import type { MaybeEventTarget } from "../../types";
import { resolveWindowSource, type ConfigurableWindow } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

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

function getScrollbarWidth(win: Window | null | undefined): number {
  if (!win) return 0;
  return win.innerWidth - win.document.documentElement.clientWidth;
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
// Core
// ---------------------------------------------------------------------------

/**
 * Framework-agnostic reactive scroll-lock controller. Applies
 * `overflow: hidden` and scrollbar-width padding to the target element (or
 * `document.body` when no target is provided), and toggles the `touchmove`
 * preventDefault listener for iOS Safari support.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createScrollLock(
  element?: MaybeEventTarget<HTMLElement>,
  initialState?: MaybeObservable<boolean>,
  options?: DeepMaybeObservable<ConfigurableWindow>
): UseScrollLockReturn {
  const isLocked$ = observable<boolean>(resolveInitialValue(initialState));
  let savedOverflow = "";
  let savedPaddingRight = "";
  let lockedElement: HTMLElement | null = null;

  const opts$ = observable(options);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- window field type varies by hint map
  const window$ = resolveWindowSource(opts$.window as any);

  // Derive document from resolved window.
  const doc$ = observable<OpaqueObject<Document> | null>(() => {
    const win = window$.get();
    return win ? (ObservableHint.opaque(win.document) as OpaqueObject<Document>) : null;
  });

  const applyLock = (el: HTMLElement) => {
    if (lockedElement === el) return;
    if (lockedElement) {
      lockedElement.style.overflow = savedOverflow;
      lockedElement.style.paddingRight = savedPaddingRight;
    }
    savedOverflow = el.style.overflow;
    savedPaddingRight = el.style.paddingRight;

    const scrollbarWidth = getScrollbarWidth(window$.peek());
    el.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      el.style.paddingRight = `${scrollbarWidth}px`;
    }
    lockedElement = el;
  };

  const removeLock = () => {
    if (!lockedElement) return;
    lockedElement.style.overflow = savedOverflow;
    lockedElement.style.paddingRight = savedPaddingRight;
    lockedElement = null;
  };

  const lock = () => {
    isLocked$.set(true);
  };

  const unlock = () => {
    isLocked$.set(false);
  };

  const toggle = () => {
    isLocked$.set((v) => !v);
  };

  // React to isLocked$ changes and element lifecycle.
  createObserve(() => {
    const el = get(element) as HTMLElement | null;
    const hasExplicitElement = element != null;
    const target = hasExplicitElement ? el : (el ?? window$.peek()?.document.body ?? null);
    const locked = isLocked$.get();

    if (locked && target) {
      applyLock(target);
    } else {
      removeLock();
    }
  });

  // iOS Safari: prevent touchmove while locked.
  const onTouchMove = (e: TouchEvent) => {
    if (isLocked$.peek()) e.preventDefault();
  };

  createEventListener(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- element fallback to document
    (element ?? (doc$ as any)) as MaybeEventTarget,
    "touchmove",
    onTouchMove,
    { passive: false }
  );

  onUnmount(removeLock);

  return { isLocked$, lock, unlock, toggle };
}
