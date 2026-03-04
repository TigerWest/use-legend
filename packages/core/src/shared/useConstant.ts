"use client";
import { useRef } from "react";

/**
 * Create a constant value that is initialized once and never changes.
 * Uses `useRef` with the `== null` lazy-init pattern (React Compiler approved).
 *
 * @param factory - Function that returns the initial value (called once on mount).
 * @returns The constant value.
 */
export function useConstant<T>(factory: () => T): T {
  const ref = useRef<T | null>(null);
  if (ref.current == null) {
    ref.current = factory();
  }
  // eslint-disable-next-line react-hooks/refs -- lazy-init: value is stable after first render
  return ref.current;
}
