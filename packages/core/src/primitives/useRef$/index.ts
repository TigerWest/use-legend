"use client";
import { type Ref } from "react";
import { useLatest } from "@shared/useLatest";
import { useConstant } from "@shared/useConstant";
import { REF$_SYMBOL, type Ref$, isRef$, createRef$ } from "./core";

export { REF$_SYMBOL, isRef$ };
export type { Ref$ };

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
  const extRef = useLatest(externalRef);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useConstant(() => createRef$(() => extRef.current as any));
}
