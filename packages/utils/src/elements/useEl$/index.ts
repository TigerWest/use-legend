import { isObservable, ObservableHint } from "@legendapp/state";
import type { Observable, OpaqueObject } from "@legendapp/state";
import { useObservable } from "@legendapp/state/react";
import { type Ref, type RefObject, useMemo, useRef } from "react";
import type { MaybeObservable } from "../../types";

export type El$<T extends Element = Element> = ((node: T | null) => void) & {
  /** returns element, registers tracking when called inside useObserve */
  get(): OpaqueObject<T> | null;
  /** returns element without registering tracking */
  peek(): OpaqueObject<T> | null;
};

/** A value that resolves to an Element, Document, or null — via El$, Observable, or raw value */
export type MaybeElement = El$<any> | MaybeObservable<HTMLElement | Document | null>;



/**
 * Creates an observable element ref. Can be used as a drop-in replacement for
 * `useRef`, composed with callback refs, or used with `forwardRef`.
 *
 * The element is wrapped with `opaqueObject` to prevent legendapp/state
 * from making DOM properties reactive (deep observation).
 *
 * @param externalRef - Optional. Accepts callback ref, RefObject, or null (forwardRef compatible).
 * @returns A callable ref that is also observable via `get`/`peek`
 *
 * @example
 * ```tsx
 * // standalone — useRef replacement
 * const el$ = useEl$<HTMLDivElement>();
 * return <div ref={el$} />;
 *
 * // forwardRef compatible
 * const Component = forwardRef<HTMLDivElement>((props, ref) => {
 *   const el$ = useEl$(ref);
 *   return <div ref={el$} />;
 * });
 *
 * // callback ref composition
 * const myRef = useCallback((node: HTMLDivElement | null) => {
 *   node?.focus();
 * }, []);
 * const el$ = useEl$(myRef);
 * return <div ref={el$} />;
 * ```
 */
export function useEl$<T extends Element = Element>(
  externalRef?: Ref<T> | null,
): El$<T> {
  const el$ = useObservable<OpaqueObject<T> | null>(null);

  // store externalRef — simple assignment each render, no new closure
  const extRef = useRef(externalRef);
  extRef.current = externalRef;

  return useMemo(
    () =>
      Object.assign(
        (node: T | null) => {
          const ext = extRef.current;
          if (typeof ext === "function") {
            ext(node);
          } else if (ext != null && "current" in ext) {
            (ext as RefObject<T | null>).current = node;
          }
          (el$ as any).set(node ? ObservableHint.opaque(node) : null);
        },
        {
          get: () => el$.get(),
          peek: () => el$.peek(),
        },
      ) as El$<T>,
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
}


/** Type guard for El$ — distinguishes it from Observable and raw values */
export function isEl$(v: unknown): v is El$<Element> {
  return typeof v === "function" && !isObservable(v) && "get" in v && "peek" in v;
}

/** Unwraps MaybeElement with tracking (use inside useObserve) */
export function getElement(v: MaybeElement): HTMLElement | Document | null {
  if (isEl$(v)) {
    const raw = v.get();
    return raw ? ((raw as OpaqueObject<Element>).valueOf() as HTMLElement) : null;
  }
  if (isObservable(v))
    return (v as Observable<HTMLElement | Document | null>).get() as unknown as HTMLElement | Document | null;
  return v as HTMLElement | Document | null;
}

/** Unwraps MaybeElement without tracking (use inside setup/peek) */
export function peekElement(v: MaybeElement): HTMLElement | Document | null {
  if (isEl$(v)) {
    const raw = v.peek();
    return raw ? ((raw as OpaqueObject<Element>).valueOf() as HTMLElement) : null;
  }
  if (isObservable(v))
    return (v as Observable<HTMLElement | Document | null>).peek() as unknown as HTMLElement | Document | null;
  return v as HTMLElement | Document | null;
}
