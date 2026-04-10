"use client";
import { useConstant } from "@shared/useConstant";
import { REF$_SYMBOL, type Ref$, isRef$, createRef$ } from "./core";

export { REF$_SYMBOL, isRef$, createRef$ };
export type { Ref$ };

/**
 * Creates an observable element ref. Drop-in replacement for `useRef`.
 *
 * - `useRef$()` / `useRef$(null)` → `Ref$<T>` — `current`, `get()`, `peek()` return `T | null`
 * - `useRef$(value)` → `StrictRef$<T>` — `current`, `get()`, `peek()` return `T` (non-null)
 *
 * @param initialValue - Optional initial value (like React's useRef(initialValue)).
 * @returns A callable ref that is also observable via `get`/`peek`
 *
 * @example
 * ```tsx
 * const el$ = useRef$<HTMLDivElement>();          // Ref$<HTMLDivElement>
 * const count$ = useRef$(0);                       // StrictRef$<number>
 * count$.current++;                                // number, not number | null
 * return <div ref={el$} />;
 * ```
 */
export type UseRef$ = typeof createRef$;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useRef$: UseRef$ = (initialValue?: any): any => {
  return useConstant(() => createRef$(initialValue));
};
