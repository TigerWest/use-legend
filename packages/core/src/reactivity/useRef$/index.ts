import { type Ref, type RefObject } from "react";
import { useLatest } from "@shared/useLatest";
import { useConstant } from "@shared/useConstant";
import { useOpaque } from "@reactivity/useOpaque";
import { ReadonlyObservable } from "types";

export const REF$_SYMBOL = Symbol("Ref$");

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
 * const el$ = useRef$<HTMLDivElement>();
 * return <div ref={el$} />;
 *
 * // forwardRef compatible
 * const Component = forwardRef<HTMLDivElement>((props, ref) => {
 *   const el$ = useRef$(ref);
 *   return <div ref={el$} />;
 * });
 *
 * // callback ref composition
 * const myRef = useCallback((node: HTMLDivElement | null) => {
 *   node?.focus();
 * }, []);
 * const el$ = useRef$(myRef);
 * return <div ref={el$} />;
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRef$<T = any>(externalRef?: Ref<T> | null): Ref$<T> {
  const el$ = useOpaque();

  // store externalRef — simple assignment each render, no new closure
  const extRef = useLatest(externalRef);

  return useConstant(() => {
    const fn = (node: T | null) => {
      const ext = extRef.current;
      if (typeof ext === "function") {
        ext(node);
      } else if (ext != null && "current" in ext) {
        (ext as RefObject<T | null>).current = node;
      }
      el$.set(node);
    };

    return new Proxy(fn, {
      get(_target, prop) {
        if (prop === REF$_SYMBOL) return true;
        if (prop === "get") return () => el$.get(); // T | null (auto-unwrapped)
        if (prop === "peek") return () => el$.peek(); // T | null (auto-unwrapped)
        if (prop === "set") return (value: T | null) => el$.set(value);
        if (prop === "current") return el$.peek(); // T | null
        // symbolGetNode etc. delegated to el$ → isObservable() = true
        const val = (el$ as any)[prop]; // eslint-disable-line @typescript-eslint/no-explicit-any
        return typeof val === "function" ? val.bind(el$) : val;
      },
      set(_target, p, newValue) {
        if (p === "current") {
          el$.set(newValue);
          return true;
        }
        return false;
      },
    }) as Ref$<T>;
  });
}

/** Type guard for Ref$ — distinguishes it from Observable and raw values */
export function isRef$(v: unknown): v is Ref$<Element> {
  return v != null && (v as any)[REF$_SYMBOL] === true; // eslint-disable-line @typescript-eslint/no-explicit-any
}
