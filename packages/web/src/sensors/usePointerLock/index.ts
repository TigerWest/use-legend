"use client";
import type { ReadonlyObservable, Supportable } from "@usels/core";
import { useSupported } from "@usels/core";
import type { OpaqueObject } from "@legendapp/state";
import { ObservableHint } from "@legendapp/state";
import { useObservable, useUnmount } from "@legendapp/state/react";
import { useConstant } from "@usels/core/shared/useConstant";
import { defaultDocument } from "@shared/configurable";
import { useEventListener } from "@browser/useEventListener";

export interface UsePointerLockReturn extends Supportable {
  /** Currently locked element */
  element$: ReadonlyObservable<OpaqueObject<Element> | null>;
  /** Request pointer lock on a target element or event's currentTarget */
  lock: (target: Element | Event) => void;
  /** Release pointer lock */
  unlock: () => void;
}

/**
 * Locks the pointer to an element, providing raw mouse movement deltas
 * via `mousemove` `movementX`/`movementY` while the cursor is hidden.
 *
 * @remarks
 * Assumes a single instance per page. `element$` mirrors `document.pointerLockElement`
 * without filtering, so concurrent instances or third-party pointer lock usage
 * on the same page may cause `element$` to reflect unexpected values.
 */
/*@__NO_SIDE_EFFECTS__*/
export function usePointerLock(): UsePointerLockReturn {
  const isSupported$ = useSupported(
    () => !!defaultDocument && "pointerLockElement" in defaultDocument
  );

  const element$ = useObservable<OpaqueObject<Element> | null>(null);

  useEventListener(
    defaultDocument ?? null,
    "pointerlockchange",
    useConstant(() => () => {
      if (!defaultDocument) return;
      const locked = defaultDocument.pointerLockElement as Element | null;
      element$.set(locked ? ObservableHint.opaque(locked) : null);
    }),
    { passive: true }
  );

  useEventListener(
    defaultDocument ?? null,
    "pointerlockerror",
    useConstant(() => () => {
      element$.set(null);
    }),
    { passive: true }
  );

  const lock = useConstant(() => (target: Element | Event) => {
    if (!isSupported$.peek()) return;
    const el = target instanceof Event ? (target.currentTarget as Element | null) : target;
    if (!el) return;
    const result = el.requestPointerLock();
    if (result instanceof Promise) {
      result.catch(() => {});
    }
  });

  const unlock = useConstant(() => () => {
    if (!defaultDocument || !element$.peek()) return;
    defaultDocument.exitPointerLock();
  });

  useUnmount(() => {
    if (defaultDocument && element$.peek()) {
      defaultDocument.exitPointerLock();
    }
  });

  return {
    isSupported$,
    element$,
    lock,
    unlock,
  };
}
