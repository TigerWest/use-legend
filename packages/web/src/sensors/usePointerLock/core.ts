import { observable, ObservableHint, type OpaqueObject } from "@legendapp/state";
import { type ReadonlyObservable, type Supportable, createSupported, onUnmount } from "@usels/core";
import { defaultDocument } from "@shared/configurable";
import { createEventListener } from "../../browser/useEventListener/core";

export interface UsePointerLockReturn extends Supportable {
  /** Currently locked element */
  element$: ReadonlyObservable<OpaqueObject<Element> | null>;
  /** Request pointer lock on a target element or event's currentTarget */
  lock: (target: Element | Event) => void;
  /** Release pointer lock */
  unlock: () => void;
}

/**
 * Framework-agnostic reactive pointer-lock controller.
 *
 * Listens to `pointerlockchange` / `pointerlockerror` on `document` and
 * exposes the currently locked element as an Observable. `lock()` / `unlock()`
 * request and release the pointer lock via the Pointer Lock API.
 */
/*@__NO_SIDE_EFFECTS__*/
export function createPointerLock(): UsePointerLockReturn {
  const isSupported$ = createSupported(
    () => !!defaultDocument && "pointerLockElement" in defaultDocument
  );

  const element$ = observable<OpaqueObject<Element> | null>(null);

  const onChange = () => {
    if (!defaultDocument) return;
    const locked = defaultDocument.pointerLockElement as Element | null;
    element$.set(locked ? ObservableHint.opaque(locked) : null);
  };

  const onError = () => {
    element$.set(null);
  };

  createEventListener(defaultDocument ?? null, "pointerlockchange", onChange, { passive: true });
  createEventListener(defaultDocument ?? null, "pointerlockerror", onError, { passive: true });

  const lock = (target: Element | Event) => {
    if (!isSupported$.peek()) return;
    const el = target instanceof Event ? (target.currentTarget as Element | null) : target;
    if (!el) return;
    const result = el.requestPointerLock();
    if (result instanceof Promise) {
      result.catch(() => {});
    }
  };

  const unlock = () => {
    if (!defaultDocument || !element$.peek()) return;
    defaultDocument.exitPointerLock();
  };

  onUnmount(() => {
    if (defaultDocument && element$.peek()) {
      defaultDocument.exitPointerLock();
    }
  });

  return {
    isSupported$,
    element$: element$ as ReadonlyObservable<OpaqueObject<Element> | null>,
    lock,
    unlock,
  };
}
