"use client";
import { type UseScrollOptions, type UseScrollReturn, useScroll } from "../useScroll";

export type { UseScrollOptions, UseScrollReturn };

export function useWindowScroll(options?: UseScrollOptions): UseScrollReturn {
  return useScroll(
    typeof window !== "undefined" ? window : null,
    options,
  );
}
