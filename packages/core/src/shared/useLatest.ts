"use client";
import { useRef } from "react";

/**
 * Keep a stable ref that always holds the latest value.
 * Centralizes the `eslint-disable` for the stable-ref pattern in one place.
 *
 * @param value - The value to keep up-to-date.
 * @returns A `MutableRefObject` — read `.current` in callbacks to get the latest value.
 */
export function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);
  // eslint-disable-next-line react-hooks/refs -- intentional: storing latest value in ref during render (stable-ref pattern)
  ref.current = value;
  return ref;
}
