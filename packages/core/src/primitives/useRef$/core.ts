import { createOpaque } from "../../reactivity/useOpaque/core";
import type { ReadonlyObservable } from "../../types";
import type { Disposable } from "../../types";

export const REF$_SYMBOL = Symbol("Ref$");

// Framework-agnostic external ref type (no React import)
type ExternalRef<T> =
  | ((node: T | null) => void)
  | { current: T | null | undefined }
  | null
  | undefined;

export type Ref$<T> = ((node: T | null) => void) &
  ReadonlyObservable<T> & {
    readonly [REF$_SYMBOL]: true;
    /** returns element, registers tracking when called inside useObserve */
    get(): T | null;
    /** returns element without registering tracking */
    peek(): T | null;
    /** imperatively set element */
    set(value: T | null): void;
    /** returns element without tracking — useRef-compatible read */
    current: T | null;
  };

/**
 * Core (framework-agnostic) version of useRef$.
 * Creates an observable element ref with opaque wrapping.
 *
 * @param getExternalRef - Optional getter returning an external ref to forward to.
 *   Pass `() => extRef.current` from useLatest in the hook layer.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createRef$<T = any>(getExternalRef?: () => ExternalRef<T>): Ref$<T> & Disposable {
  const el$ = createOpaque<T>();

  const fn = (node: T | null) => {
    const ext = getExternalRef?.();
    if (typeof ext === "function") {
      ext(node);
    } else if (ext != null && "current" in ext) {
      (ext as { current: T | null }).current = node;
    }
    el$.set(node);
  };

  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === REF$_SYMBOL) return true;
      if (prop === "get") return () => el$.get();
      if (prop === "peek") return () => el$.peek();
      if (prop === "set") return (value: T | null) => el$.set(value);
      if (prop === "current") return el$.peek();
      if (prop === "dispose") return () => {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (el$ as any)[prop];
      return typeof val === "function" ? val.bind(el$) : val;
    },
    set(_target, p, newValue) {
      if (p === "current") {
        el$.set(newValue);
        return true;
      }
      return false;
    },
  }) as Ref$<T> & Disposable;
}

/** Type guard for Ref$ — distinguishes it from Observable and raw values */
export function isRef$(v: unknown): v is Ref$<Element> {
  return v != null && (v as any)[REF$_SYMBOL] === true; // eslint-disable-line @typescript-eslint/no-explicit-any
}
