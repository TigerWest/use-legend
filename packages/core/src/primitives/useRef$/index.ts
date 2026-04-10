"use client";
import { useConstant } from "@shared/useConstant";
import { REF$_SYMBOL, type Ref$, isRef$, createRef$ } from "./core";

export { REF$_SYMBOL, isRef$ };
export type { Ref$ };

/**
 * Creates an observable element ref. Drop-in replacement for `useRef`.
 *
 * @param initialValue - Optional initial value (like React's useRef(initialValue)).
 * @returns A callable ref that is also observable via `get`/`peek`
 *
 * @example
 * ```tsx
 * const el$ = useRef$<HTMLDivElement>();
 * return <div ref={el$} />;
 *
 * // with initial value
 * const el$ = useRef$<HTMLDivElement>(someElement);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRef$<T = any>(initialValue?: T | null): Ref$<T> {
  return useConstant(() => createRef$<T>(initialValue));
}
